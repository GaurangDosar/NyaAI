import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, Mail, Phone, MapPin, Edit2, Save, X, 
  MessageSquare, Award, FileText, TrendingUp, 
  Clock, Calendar, Activity, BarChart3, Sparkles,
  Bot, Shield, CheckCircle2, ArrowRight
} from 'lucide-react';

interface AnalyticsData {
  totalChats: number;
  totalMessages: number;
  schemesViewed: number;
  recentActivity: {
    type: string;
    message: string;
    timestamp: string;
  }[];
  chatsByDay: { day: string; count: number }[];
}

const Dashboard = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalChats: 0,
    totalMessages: 0,
    schemesViewed: 0,
    recentActivity: [],
    chatsByDay: []
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || ''
  });

  // Timeout after 3 seconds of loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('Dashboard - Loading timeout reached (3s), forcing render');
        setLoadingTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (user && !loading) {
      fetchAnalytics();
    }
  }, [user, loading]);

  useEffect(() => {
    // Update form data when profile loads
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || ''
      });
    }
  }, [profile]);

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);

      // Fetch chat sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions' as any)
        .select('id, created_at, title')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (sessionsError) console.error('Sessions error:', sessionsError);

      // Fetch chat messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages' as any)
        .select('id, role, created_at, session_id')
        .in('session_id', sessions?.map((s: any) => s.id) || []);

      if (messagesError) console.error('Messages error:', messagesError);

      // Fetch scheme applications (if table exists)
      let schemesCount = 0;
      try {
        const { count } = await supabase
          .from('scheme_applications' as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id);
        schemesCount = count || 0;
      } catch (err) {
        console.log('Scheme applications table might not exist yet');
      }

      // Calculate chats by day (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chatsByDay = last7Days.map(day => {
        const count = sessions?.filter((s: any) => 
          s.created_at.split('T')[0] === day
        ).length || 0;
        return {
          day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
          count
        };
      });

      // Recent activity
      const recentActivity = [
        ...(sessions?.slice(0, 3).map((s: any) => ({
          type: 'chat',
          message: s.title || 'New chat session',
          timestamp: s.created_at
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setAnalytics({
        totalChats: sessions?.length || 0,
        totalMessages: messages?.length || 0,
        schemesViewed: schemesCount,
        recentActivity,
        chatsByDay
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Show loading only for auth loading, not profile - with timeout
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center">
        <div className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, hsl(280 100% 60% / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(290 80% 70% / 0.15) 0%, transparent 50%)
            `
          }}
        />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Create a default profile if none exists yet
  const displayProfile = profile || {
    name: user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    phone: '',
    location: ''
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: displayProfile.name || '',
      email: displayProfile.email || '',
      phone: displayProfile.phone || '',
      location: displayProfile.location || ''
    });
    setIsEditing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'scheme':
        return <Award className="h-4 w-4 text-green-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Purple radial gradients */}
      <div className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, hsl(280 100% 60% / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, hsl(290 80% 70% / 0.15) 0%, transparent 50%)
          `
        }}
      />
      
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Welcome back, {displayProfile.name?.split(' ')[0]}! 👋</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                    <p className="text-3xl font-bold mt-2">{analytics.totalChats}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      AI Legal Advisor
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Messages Exchanged</p>
                    <p className="text-3xl font-bold mt-2">{analytics.totalMessages}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      With AI Assistant
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Schemes Viewed</p>
                    <p className="text-3xl font-bold mt-2">{analytics.schemesViewed}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Government Programs
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                    <Badge className="mt-2" variant="default">
                      <Shield className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Activity Chart */}
            <Card className="glass lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Activity This Week
                </CardTitle>
                <CardDescription>Your daily conversation activity</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.chatsByDay.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">{item.day}</span>
                          <span className="font-bold">{item.count} chat{item.count !== 1 ? 's' : ''}</span>
                        </div>
                        <Progress 
                          value={(item.count / Math.max(...analytics.chatsByDay.map(d => d.count), 1)) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : analytics.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.message}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {getTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center">
                    <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground mt-1">Start a conversation to see activity here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Section */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Manage your personal details and preferences</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} size="sm" variant="outline" className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center">
                  <Avatar className="h-32 w-32 mb-4 border-4 border-primary/20">
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {getInitials(displayProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{displayProfile.name}</h2>
                  <Badge variant="outline" className="mt-2">
                    <Mail className="h-3 w-3 mr-1" />
                    {displayProfile.email}
                  </Badge>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="pt-4 border-t">
                      <Button className="w-full md:w-auto group">
                        Get Started with AI Lawyer
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;