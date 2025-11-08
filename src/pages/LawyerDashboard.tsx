import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Briefcase, 
  Users, 
  MessageSquare, 
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Save,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Case {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'won' | 'lost' | 'closed';
  created_at: string;
  updated_at: string;
  client: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface ClientRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'active' | 'archived';
  created_at: string;
  client: {
    name: string;
    avatar_url: string;
    email: string;
  };
  messages: Array<{
    text: string;
  }>;
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const LawyerDashboard = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'7days' | '30days' | 'all'>('30days');
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [lawyerProfile, setLawyerProfile] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileForm, setProfileForm] = useState({
    location: '',
    bio: '',
    experience_years: 0,
    availability: true
  });
  
  // Stats state
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    totalClients: 0,
    wonCases: 0,
    lostCases: 0,
    pendingCases: 0,
    closedCases: 0
  });
  
  // Cases state
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [caseFilter, setCaseFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  
  // Client requests state
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [acceptForm, setAcceptForm] = useState({ title: '', description: '' });
  
  // Chart data
  const [casesByStatus, setCasesByStatus] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  // Load lawyer data
  useEffect(() => {
    const loadLawyerData = async () => {
      if (!user || userRole !== 'lawyer') {
        return;
      }
      
      // Prevent loading if already loaded
      if (dataLoaded) {
        console.log('LawyerDashboard - Data already loaded, skipping');
        return;
      }
      
      console.log('LawyerDashboard - Starting to load data');
      setLoading(true);
      
      try {
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error loading profile:', profileError);
        }
        
        if (profileData) {
          setProfile(profileData);
          setProfileForm(prev => ({
            ...prev,
            location: profileData.location || ''
          }));
        }
        
        // Load lawyer profile
        const { data: lawyerData, error: lawyerError } = await supabase
          .from('lawyer_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (lawyerError) {
          console.error('Error loading lawyer profile:', lawyerError);
        }
        
        if (lawyerData) {
          setLawyerProfile(lawyerData);
          setProfileForm(prev => ({
            ...prev,
            bio: lawyerData.bio || '',
            experience_years: lawyerData.experience_years || 0,
            availability: lawyerData.availability
          }));
        }
        
        // Load cases
        await loadCases();
        
        // Load client requests
        await loadClientRequests();
        
        console.log('LawyerDashboard - Data loading complete');
        setDataLoaded(true);
        
      } catch (error) {
        console.error('Error loading lawyer data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && userRole === 'lawyer' && !dataLoaded) {
      loadLawyerData();
    }
  }, [user, userRole, dataLoaded]);

  const loadCases = async () => {
    if (!user) return;
    
    try {
      const { data: casesData, error } = await supabase
        .from('cases' as any)
        .select('*')
        .eq('lawyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading cases:', error);
        return;
      }
      
      if (casesData) {
        // Get client profiles
        const clientIds = [...new Set(casesData.map((c: any) => c.client_id))];
        const { data: clients } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, email')
          .in('id', clientIds);
        
        const formattedCases = casesData.map((c: any) => ({
          ...c,
          client: clients?.find((cl: any) => cl.id === c.client_id) || {
            name: 'Unknown',
            avatar_url: '',
            email: ''
          }
        }));
        
        setCases(formattedCases);
        setFilteredCases(formattedCases);
        
        // Calculate stats
        calculateStats(formattedCases);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadClientRequests = async () => {
    if (!user) return;
    
    try {
      const { data: convData } = await supabase
        .from('conversations' as any)
        .select('*')
        .eq('lawyer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (convData) {
        const clientIds = [...new Set(convData.map((c: any) => c.user_id))];
        const { data: clients } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, email')
          .in('id', clientIds);
        
        const convIds = convData.map((c: any) => c.id);
        const { data: messages } = await supabase
          .from('lawyer_messages' as any)
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true });
        
        const formatted = convData.map((conv: any) => ({
          ...conv,
          client: clients?.find((cl: any) => cl.id === conv.user_id) || {
            name: 'Unknown',
            avatar_url: '',
            email: ''
          },
          messages: messages?.filter((m: any) => m.conversation_id === conv.id).map((m: any) => ({
            text: m.text
          })) || []
        }));
        
        setClientRequests(formatted);
      }
    } catch (error) {
      console.error('Error loading client requests:', error);
    }
  };

  const calculateStats = (casesData: Case[]) => {
    const now = new Date();
    const filterDate = timePeriod === '7days' 
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : timePeriod === '30days'
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : new Date(0);
    
    const filtered = casesData.filter(c => new Date(c.created_at) >= filterDate);
    
    const statusCounts = filtered.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const uniqueClients = new Set(filtered.map(c => c.client_id));
    
    setStats({
      totalCases: filtered.length,
      activeCases: statusCounts['active'] || 0,
      totalClients: uniqueClients.size,
      wonCases: statusCounts['won'] || 0,
      lostCases: statusCounts['lost'] || 0,
      pendingCases: statusCounts['pending'] || 0,
      closedCases: statusCounts['closed'] || 0
    });
    
    // Chart data - cases by status
    const statusData = [
      { name: 'Pending', value: statusCounts['pending'] || 0, color: COLORS[0] },
      { name: 'Active', value: statusCounts['active'] || 0, color: COLORS[1] },
      { name: 'Won', value: statusCounts['won'] || 0, color: COLORS[2] },
      { name: 'Lost', value: statusCounts['lost'] || 0, color: COLORS[3] },
      { name: 'Closed', value: statusCounts['closed'] || 0, color: COLORS[4] }
    ].filter(d => d.value > 0);
    
    setCasesByStatus(statusData);
    
    // Monthly trend (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = monthNames[date.getMonth()];
      const count = casesData.filter(c => {
        const caseDate = new Date(c.created_at);
        return caseDate.getMonth() === date.getMonth() && caseDate.getFullYear() === date.getFullYear();
      }).length;
      trendData.push({ month, cases: count });
    }
    setMonthlyTrend(trendData);
  };

  useEffect(() => {
    if (cases.length > 0) {
      calculateStats(cases);
    }
  }, [timePeriod, cases]);

  const handleCaseFilterChange = (filter: string) => {
    setCaseFilter(filter);
    if (filter === 'all') {
      setFilteredCases(cases);
    } else {
      setFilteredCases(cases.filter(c => c.status === filter));
    }
  };

  const handleUpdateCaseStatus = async (caseId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('cases' as any)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', caseId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Case status updated successfully',
      });
      
      await loadCases();
    } catch (error) {
      console.error('Error updating case:', error);
      toast({
        title: 'Error',
        description: 'Failed to update case status',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptRequest = async (request: ClientRequest) => {
    if (!acceptForm.title || !acceptForm.description) {
      toast({
        title: 'Missing Information',
        description: 'Please provide case title and description',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-case`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            conversation_id: request.id,
            accepted: true,
            title: acceptForm.title,
            description: acceptForm.description
          }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to accept request');
      
      toast({
        title: 'Request Accepted',
        description: 'Case created successfully',
      });
      
      setSelectedRequest(null);
      setAcceptForm({ title: '', description: '' });
      await loadClientRequests();
      await loadCases();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (request: ClientRequest) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-case`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            conversation_id: request.id,
            accepted: false
          }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to reject request');
      
      toast({
        title: 'Request Rejected',
        description: 'Client has been notified',
      });
      
      setSelectedRequest(null);
      await loadClientRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      let avatarUrl = profile?.avatar_url;
      
      // Upload avatar if a new file is selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
        
        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          toast({
            title: 'Warning',
            description: 'Profile updated but avatar upload failed',
            variant: 'destructive',
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          
          avatarUrl = publicUrl;
        }
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          location: profileForm.location,
          avatar_url: avatarUrl
        })
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;
      
      // Update lawyer profile
      const { error: lawyerError } = await supabase
        .from('lawyer_profiles')
        .update({
          bio: profileForm.bio,
          experience_years: profileForm.experience_years,
          availability: profileForm.availability
        })
        .eq('user_id', user.id);
      
      if (lawyerError) throw lawyerError;
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      
      setEditingProfile(false);
      setAvatarFile(null);
      
      // Reload profile
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (updatedProfile) setProfile(updatedProfile);
      
      const { data: updatedLawyerProfile } = await supabase
        .from('lawyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (updatedLawyerProfile) setLawyerProfile(updatedLawyerProfile);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  // Show loading only for data, not auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for role to load before deciding what to do
  if (userRole === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading user role...</p>
        </div>
      </div>
    );
  }

  // Redirect if not a lawyer
  if (userRole !== 'lawyer') {
    return <Navigate to="/" replace />;
  }

  // Show loading while fetching lawyer data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Lawyer Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.name || 'Lawyer'}!</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="requests">Client Requests ({clientRequests.length})</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Time Period Filter */}
            <div className="flex justify-end">
              <Select value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCases}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeCases} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClients}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique clients
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Cases Won</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.wonCases}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.lostCases} lost
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clientRequests.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting response
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cases by Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Cases by Status</CardTitle>
                  <CardDescription>Distribution of cases across different statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {casesByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={casesByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {casesByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No case data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                  <CardDescription>Cases created over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="cases" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No trend data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-6">
            {/* Case Filters */}
            <div className="flex gap-2">
              <Button
                variant={caseFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCaseFilterChange('all')}
              >
                All ({cases.length})
              </Button>
              <Button
                variant={caseFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCaseFilterChange('pending')}
              >
                Pending ({stats.pendingCases})
              </Button>
              <Button
                variant={caseFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCaseFilterChange('active')}
              >
                Active ({stats.activeCases})
              </Button>
              <Button
                variant={caseFilter === 'won' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCaseFilterChange('won')}
              >
                Won ({stats.wonCases})
              </Button>
              <Button
                variant={caseFilter === 'lost' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCaseFilterChange('lost')}
              >
                Lost ({stats.lostCases})
              </Button>
              <Button
                variant={caseFilter === 'closed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCaseFilterChange('closed')}
              >
                Closed ({stats.closedCases})
              </Button>
            </div>

            {/* Cases List */}
            <div className="space-y-4">
              {filteredCases.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No cases found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredCases.map((caseItem) => (
                  <Card key={caseItem.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={caseItem.client.avatar_url} />
                            <AvatarFallback>
                              {caseItem.client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{caseItem.title}</h3>
                              <Badge variant={
                                caseItem.status === 'won' ? 'default' :
                                caseItem.status === 'active' ? 'secondary' :
                                caseItem.status === 'lost' ? 'destructive' :
                                'outline'
                              }>
                                {caseItem.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Client: {caseItem.client.name}
                            </p>
                            <p className="text-sm">{caseItem.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Created: {new Date(caseItem.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCase(caseItem)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Select
                            value={caseItem.status}
                            onValueChange={(v) => handleUpdateCaseStatus(caseItem.id, v)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="won">Won</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Client Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="space-y-4">
              {clientRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No pending requests</p>
                  </CardContent>
                </Card>
              ) : (
                clientRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.client.avatar_url} />
                            <AvatarFallback>
                              {request.client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{request.client.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {request.client.email}
                            </p>
                            {request.messages.length > 0 && (
                              <div className="bg-muted p-3 rounded-md mb-2">
                                <p className="text-sm">{request.messages[0].text}</p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Requested: {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectRequest(request)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Update your profile information</CardDescription>
                  </div>
                  {!editingProfile && (
                    <Button onClick={() => setEditingProfile(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {profile?.name?.split(' ').map((n: string) => n[0]).join('') || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  {editingProfile && (
                    <div className="w-full max-w-xs">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAvatarFile(file);
                        }}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        Upload a profile picture
                      </p>
                    </div>
                  )}
                </div>

                {/* Profile Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={profile?.name || ''} disabled />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={profile?.email || ''} disabled />
                    </div>
                  </div>

                  <div>
                    <Label>Specialization</Label>
                    <Input value={lawyerProfile?.specialization || ''} disabled />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Experience (Years)</Label>
                      {editingProfile ? (
                        <Input
                          type="number"
                          min="0"
                          value={profileForm.experience_years}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                        />
                      ) : (
                        <Input value={lawyerProfile?.experience_years || 0} disabled />
                      )}
                    </div>
                    <div>
                      <Label>License Number</Label>
                      <Input value={lawyerProfile?.license_number || ''} disabled />
                    </div>
                  </div>

                  <div>
                    <Label>Location</Label>
                    {editingProfile ? (
                      <LocationAutocomplete
                        value={profileForm.location}
                        onChange={(value) => setProfileForm(prev => ({ ...prev, location: value }))}
                        placeholder="Enter your location"
                      />
                    ) : (
                      <Input value={profile?.location || ''} disabled />
                    )}
                  </div>

                  <div>
                    <Label>Bio</Label>
                    {editingProfile ? (
                      <Textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell clients about yourself..."
                        rows={4}
                      />
                    ) : (
                      <Textarea value={lawyerProfile?.bio || ''} disabled rows={4} />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Availability</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow clients to send you requests
                      </p>
                    </div>
                    <Switch
                      checked={profileForm.availability}
                      onCheckedChange={(checked) => setProfileForm(prev => ({ ...prev, availability: checked }))}
                      disabled={!editingProfile}
                    />
                  </div>
                </div>

                {editingProfile && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingProfile(false);
                        setAvatarFile(null);
                        setProfileForm({
                          location: profile?.location || '',
                          bio: lawyerProfile?.bio || '',
                          experience_years: lawyerProfile?.experience_years || 0,
                          availability: lawyerProfile?.availability || true
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Case Details Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCase.client.avatar_url} />
                  <AvatarFallback>
                    {selectedCase.client.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedCase.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCase.client.name}</p>
                </div>
                <Badge className="ml-auto" variant={
                  selectedCase.status === 'won' ? 'default' :
                  selectedCase.status === 'active' ? 'secondary' :
                  selectedCase.status === 'lost' ? 'destructive' :
                  'outline'
                }>
                  {selectedCase.status}
                </Badge>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="mt-1 text-sm">{selectedCase.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client Email</Label>
                  <p className="text-sm">{selectedCase.client.email}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedCase.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <Label>Last Updated</Label>
                <p className="text-sm">{new Date(selectedCase.updated_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Request Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => {
        setSelectedRequest(null);
        setAcceptForm({ title: '', description: '' });
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Accept Client Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedRequest.client.avatar_url} />
                  <AvatarFallback>
                    {selectedRequest.client.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedRequest.client.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRequest.client.email}</p>
                </div>
              </div>
              
              {selectedRequest.messages.length > 0 && (
                <div>
                  <Label>Client Message</Label>
                  <div className="mt-1 bg-muted p-3 rounded-md">
                    <p className="text-sm">{selectedRequest.messages[0].text}</p>
                  </div>
                </div>
              )}
              
              <div>
                <Label>Case Title *</Label>
                <Input
                  value={acceptForm.title}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a title for this case"
                />
              </div>
              
              <div>
                <Label>Case Description *</Label>
                <Textarea
                  value={acceptForm.description}
                  onChange={(e) => setAcceptForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the case details..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleAcceptRequest(selectedRequest)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept Request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setAcceptForm({ title: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LawyerDashboard;
