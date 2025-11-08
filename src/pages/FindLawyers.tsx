import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Star, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X,
  MessageSquare,
  Scale,
  Award,
  Phone,
  Mail,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lawyer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  avatar_url?: string;
  specialization: string;
  experience_years: number;
  license_number?: string;
  bio?: string;
  rating?: number;
  availability: boolean;
}

interface Filters {
  expertise: string;
  location: string;
  minExperience: number;
  rating: number;
  sort: 'relevance' | 'rating' | 'experience' | 'name';
  page: number;
}

const SPECIALIZATIONS = [
  'All Specializations',
  'Civil Law',
  'Criminal Law',
  'Corporate Law',
  'Family Law',
  'Property Law',
  'Labour Law',
  'Tax Law',
  'Intellectual Property',
  'Constitutional Law',
  'Consumer Law',
  'Cyber Law'
];

const FindLawyers = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<Filters>({
    expertise: '',
    location: '',
    minExperience: 0,
    rating: 0,
    sort: 'relevance',
    page: 1
  });
  
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  
  // Messaging system state - now using database
  const [conversations, setConversations] = useState<Array<{
    id: string;
    lawyer_id: string;
    lawyer: Lawyer;
    messages: Array<{ id: string; text: string; sender: 'me' | 'lawyer'; timestamp: Date; sender_id: string }>;
    unreadCount: number;
  }>>([]);
  const [openChats, setOpenChats] = useState<Set<string>>(new Set());
  const [expandedChats, setExpandedChats] = useState<Set<string>>(new Set());
  const [showMessagingPanel, setShowMessagingPanel] = useState(false);
  const [activeMessages, setActiveMessages] = useState<Map<string, string>>(new Map());
  const [loadingConversations, setLoadingConversations] = useState(false);

  const perPage = 12;
  const totalPages = Math.ceil(total / perPage);

  // Debug: Log component state
  useEffect(() => {
    console.log('FindLawyers component mounted');
    console.log('Initial state:', { loading, showResults, lawyersCount: lawyers.length, total });
  }, []);

  const searchLawyers = useCallback(async () => {
    console.log('searchLawyers called with filters:', filters);
    setLoading(true);
    setShowResults(true);

    try {
      console.log('Getting session from AuthContext...');
      console.log('Session:', session);
      
      if (!session?.access_token) {
        throw new Error('Not authenticated - no access token from session');
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lawyer-finder`;
      const payload = {
        specialization: filters.expertise === 'All Specializations' ? '' : filters.expertise,
        location: filters.location,
        minExperience: filters.minExperience,
        rating: filters.rating,
        sort: filters.sort,
        page: filters.page
      };

      console.log('Searching lawyers with URL:', url);
      console.log('Payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search lawyers');
      }

      console.log('Received data:', data);
      setLawyers(data.lawyers || []);
      setTotal(data.lawyers?.length || 0); // Use actual filtered count, not database total
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: error.message || 'Failed to search for lawyers',
        variant: 'destructive'
      });
      // Reset loading state even on error
      setLawyers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, toast, session]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search button clicked!');
    console.log('Current filters:', filters);
    setFilters(prev => ({ ...prev, page: 1 }));
    searchLawyers();
  };

  const backToSearch = () => {
    setShowResults(false);
    setLawyers([]);
    setTotal(0);
  };

  const changePage = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleContactLawyer = async (lawyer: Lawyer) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to send a request',
        variant: 'destructive',
      });
      return;
    }

    console.log('handleContactLawyer called with lawyer:', {
      id: lawyer.id,
      user_id: lawyer.user_id,
      name: lawyer.name,
      email: lawyer.email
    });

    // Check if conversation already exists (use user_id, not id)
    const existingConv = conversations.find(c => c.lawyer_id === lawyer.user_id);
    
    if (existingConv) {
      // Open existing conversation
      console.log('Found existing conversation:', existingConv.id);
      const newOpenChats = new Set(openChats);
      newOpenChats.add(lawyer.user_id);
      setOpenChats(newOpenChats);
    } else {
      // Create temporary conversation in UI (will be persisted when first message is sent)
      console.log('Creating new temporary conversation with lawyer.user_id:', lawyer.user_id);
      const tempConv = {
        id: 'temp-' + lawyer.user_id, // Temporary ID
        lawyer_id: lawyer.user_id, // Use user_id for foreign key
        lawyer,
        messages: [],
        unreadCount: 0
      };
      setConversations(prev => [...prev, tempConv]);
      
      // Open the chat window
      const newOpenChats = new Set(openChats);
      newOpenChats.add(lawyer.user_id);
      setOpenChats(newOpenChats);
    }
    
    setSelectedLawyer(null); // Close the profile modal
  };

  const handleSendMessage = async (lawyerId: string) => {
    const messageText = activeMessages.get(lawyerId) || '';
    if (!messageText.trim()) return;
    
    if (!user || !session?.access_token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to send messages',
        variant: 'destructive',
      });
      return;
    }

    console.log('Sending message to lawyer:', lawyerId);
    console.log('Message text:', messageText);
    console.log('User:', user.id);
    console.log('Session token exists:', !!session.access_token);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message`;
      console.log('Edge function URL:', url);
      
      // Call send-message edge function
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          lawyer_id: lawyerId,
          text: messageText,
          attachments: [],
          is_case_request: false
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      // Update conversations state with the new message
      setConversations(prev => {
        const convIndex = prev.findIndex(c => c.lawyer_id === lawyerId);
        if (convIndex >= 0) {
          const updated = [...prev];
          updated[convIndex] = {
            ...updated[convIndex],
            id: data.conversation_id, // Update with real ID if it was temp
            messages: [...updated[convIndex].messages, {
              id: data.message.id,
              text: data.message.text,
              sender: 'me' as const,
              timestamp: new Date(data.message.created_at),
              sender_id: user.id
            }]
          };
          return updated;
        }
        return prev;
      });
      
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully',
      });
      
      // Clear message input for this chat
      const newActiveMessages = new Map(activeMessages);
      newActiveMessages.set(lawyerId, '');
      setActiveMessages(newActiveMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseChat = (lawyerId: string) => {
    const newOpenChats = new Set(openChats);
    newOpenChats.delete(lawyerId);
    setOpenChats(newOpenChats);
  };

  const handleMinimizeChat = (lawyerId: string) => {
    const newExpandedChats = new Set(expandedChats);
    newExpandedChats.delete(lawyerId);
    setExpandedChats(newExpandedChats);
  };

  const handleMaximizeChat = (lawyerId: string) => {
    const newExpandedChats = new Set(expandedChats);
    newExpandedChats.add(lawyerId);
    setExpandedChats(newExpandedChats);
  };

  const handleCallClick = () => {
    setShowPhoneNumber(true);
  };

  // Load conversations from database
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      setLoadingConversations(true);
      try {
        // Fetch conversations with messages and lawyer profile using RPC or direct query
        const { data: convData, error: convError } = await supabase
          .from('conversations' as any)
          .select(`
            id,
            lawyer_id,
            last_message_at
          `)
          .eq('user_id', user.id)
          .order('last_message_at', { ascending: false });

        if (convError) {
          console.error('Error loading conversations:', convError);
          return;
        }

        if (convData && convData.length > 0) {
          // Get unique lawyer IDs
          const lawyerIds = [...new Set(convData.map((c: any) => c.lawyer_id))];
          
          // Fetch lawyer profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', lawyerIds);
            
          // Fetch lawyer details
          const { data: lawyerProfiles } = await supabase
            .from('lawyer_profiles')
            .select('*')
            .in('user_id', lawyerIds);

          // Fetch messages for all conversations
          const convIds = convData.map((c: any) => c.id);
          const { data: messagesData } = await supabase
            .from('lawyer_messages' as any)
            .select('*')
            .in('conversation_id', convIds)
            .order('created_at', { ascending: true });

          // Transform data to match our conversation structure
          const formattedConversations = convData.map((conv: any) => {
            const profile = profiles?.find((p: any) => p.id === conv.lawyer_id);
            const lawyerProfile = lawyerProfiles?.find((lp: any) => lp.user_id === conv.lawyer_id);
            const convMessages = messagesData?.filter((m: any) => m.conversation_id === conv.id) || [];
            
            return {
              id: conv.id,
              lawyer_id: conv.lawyer_id,
              lawyer: {
                id: conv.lawyer_id,
                user_id: conv.lawyer_id,
                name: profile?.name || 'Unknown',
                avatar_url: profile?.avatar_url || '',
                location: profile?.location || '',
                email: profile?.email || '',
                phone: profile?.phone || '',
                specialization: lawyerProfile?.specialization || '',
                experience_years: lawyerProfile?.experience_years || 0,
                bio: lawyerProfile?.bio || '',
                availability: lawyerProfile?.availability || true,
                rating: 4.5,
                license_number: lawyerProfile?.license_number || ''
              } as Lawyer,
              messages: convMessages.map((msg: any) => ({
                id: msg.id,
                text: msg.text,
                sender: msg.sender_id === user.id ? 'me' as const : 'lawyer' as const,
                timestamp: new Date(msg.created_at),
                sender_id: msg.sender_id
              })),
              unreadCount: 0
            };
          });

          setConversations(formattedConversations);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoadingConversations(false);
      }
    };

    loadConversations();
  }, [user]);

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('lawyer-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lawyer_messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Update conversations with the new message
          setConversations((prev) => {
            const convIndex = prev.findIndex(c => c.id === newMessage.conversation_id);
            if (convIndex >= 0) {
              const updated = [...prev];
              updated[convIndex] = {
                ...updated[convIndex],
                messages: [...updated[convIndex].messages, {
                  id: newMessage.id,
                  text: newMessage.text,
                  sender: newMessage.sender_id === user.id ? 'me' as const : 'lawyer' as const,
                  timestamp: new Date(newMessage.created_at),
                  sender_id: newMessage.sender_id
                }]
              };
              return updated;
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    console.log('useEffect triggered - showResults:', showResults, 'filters.page:', filters.page);
    if (showResults && filters.page > 0) {
      searchLawyers();
    }
  }, [showResults, filters.page, filters.sort, filters.rating, filters.minExperience, filters.expertise, searchLawyers]);

  if (authLoading) {
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
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

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
      
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-8">
        {!showResults ? (
          /* Search Landing Page */
          <div className="text-center mb-8 pt-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full glass border border-primary/20 mb-4">
              <Scale className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm text-primary font-medium">Verified Legal Professionals</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find the <span className="bg-gradient-primary bg-clip-text text-transparent">Right Lawyer</span>
              <br />
              for Your Case
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Connect with qualified lawyers in your area specializing in your specific legal needs
            </p>

            {/* Search Form */}
            <Card className="max-w-4xl mx-auto glass">
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Expertise */}
                    <div className="space-y-2">
                      <Label htmlFor="expertise" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Field / Expertise
                      </Label>
                      <Select
                        value={filters.expertise}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, expertise: value }))}
                      >
                        <SelectTrigger id="expertise">
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIZATIONS.map((spec) => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <LocationAutocomplete
                      id="location"
                      value={filters.location}
                      onChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
                      placeholder="e.g. Mumbai, Delhi"
                    />
                  </div>                    {/* Minimum Experience */}
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Min. Experience: {filters.minExperience} years
                      </Label>
                      <Slider
                        id="experience"
                        min={0}
                        max={30}
                        step={1}
                        value={[filters.minExperience]}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, minExperience: value[0] }))}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full md:w-auto gap-2">
                    <Search className="h-5 w-5" />
                    Search Lawyers
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Results Page with Sidebar */
          <div className="pt-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={backToSearch}
              className="mb-6 gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Search
            </Button>

            <div className="flex gap-6">
              {/* Sidebar Filters */}
              <Card className="w-80 glass h-fit sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters & Sort
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Expertise Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="sidebar-expertise" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Expertise
                    </Label>
                    <Select
                      value={filters.expertise}
                      onValueChange={(value) => {
                        setFilters(prev => ({ ...prev, expertise: value, page: 1 }));
                      }}
                    >
                      <SelectTrigger id="sidebar-expertise">
                        <SelectValue placeholder="All Specializations" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALIZATIONS.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="sidebar-location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <LocationAutocomplete
                      id="sidebar-location"
                      value={filters.location}
                      onChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
                      onSelect={() => setFilters(prev => ({ ...prev, page: 1 }))}
                      placeholder="e.g. Mumbai, Delhi"
                    />
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select
                      value={filters.sort}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, sort: value, page: 1 }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="rating">Highest Rating</SelectItem>
                        <SelectItem value="experience">Most Experience</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating Filter */}
                  <div className="space-y-2">
                    <Label>Minimum Rating</Label>
                    <Select
                      value={filters.rating.toString()}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, rating: parseInt(value), page: 1 }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">All Ratings</SelectItem>
                        <SelectItem value="3">3+ Stars</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experience Range */}
                  <div className="space-y-2">
                    <Label>Minimum Experience: {filters.minExperience} years</Label>
                    <Slider
                      min={0}
                      max={30}
                      step={1}
                      value={[filters.minExperience]}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, minExperience: value[0], page: 1 }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="flex-1">
                {/* Results Header */}
                <div className="glass p-4 rounded-lg mb-6">
                  <p className="text-sm text-muted-foreground">
                    {loading ? (
                      'Searching...'
                    ) : (
                      <>Found <span className="font-semibold text-foreground">{total}</span> lawyer{total !== 1 ? 's' : ''}</>
                    )}
                  </p>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="glass">
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center space-y-3">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!loading && lawyers.length === 0 && (
                  <Card className="glass">
                    <CardContent className="py-12 text-center">
                      <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Lawyers Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search criteria or filters
                      </p>
                      <Button onClick={backToSearch} variant="outline">
                        New Search
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Lawyer Cards Grid */}
                {!loading && lawyers.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {lawyers.map((lawyer) => (
                        <Card
                          key={lawyer.id}
                          className="glass hover-lift cursor-pointer group"
                          onClick={() => {
                            setSelectedLawyer(lawyer);
                            setShowPhoneNumber(false);
                          }}
                        >
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                              <Avatar className="h-20 w-20">
                                <AvatarImage src={lawyer.avatar_url} alt={lawyer.name} />
                                <AvatarFallback className="bg-primary/10 text-lg">
                                  {lawyer.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="space-y-1">
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                  {lawyer.name}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {lawyer.specialization}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{lawyer.location}</span>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Award className="h-4 w-4 text-primary" />
                                  <span>{lawyer.experience_years} years</span>
                                </div>
                                
                                {lawyer.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                    <span>{lawyer.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>

                              <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changePage(filters.page - 1)}
                          disabled={filters.page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (filters.page <= 3) {
                              pageNum = i + 1;
                            } else if (filters.page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = filters.page - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={filters.page === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => changePage(pageNum)}
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changePage(filters.page + 1)}
                          disabled={filters.page === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lawyer Detail Modal */}
      <Dialog open={!!selectedLawyer} onOpenChange={() => setSelectedLawyer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLawyer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Lawyer Profile</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={selectedLawyer.avatar_url} alt={selectedLawyer.name} />
                    <AvatarFallback className="bg-primary/10 text-2xl">
                      {selectedLawyer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-bold">{selectedLawyer.name}</h3>
                    <Badge variant="secondary">{selectedLawyer.specialization}</Badge>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedLawyer.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {selectedLawyer.experience_years} years experience
                      </div>
                      {selectedLawyer.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          {selectedLawyer.rating.toFixed(1)} rating
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedLawyer.bio && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      About
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedLawyer.bio}
                    </p>
                  </div>
                )}

                {/* License */}
                {selectedLawyer.license_number && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      License Information
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      License No: <span className="font-mono">{selectedLawyer.license_number}</span>
                    </p>
                  </div>
                )}

                {/* Contact */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{selectedLawyer.email}</span>
                    </div>
                    {selectedLawyer.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{selectedLawyer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1 gap-2" 
                    size="lg"
                    onClick={() => handleContactLawyer(selectedLawyer)}
                  >
                    <MessageSquare className="h-5 w-5" />
                    Send a request
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={handleCallClick}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>

                {showPhoneNumber && selectedLawyer.phone && (
                  <div className="text-center p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Phone Number:</p>
                    <p className="text-lg font-semibold">{selectedLawyer.phone}</p>
                  </div>
                )}

                {!selectedLawyer.phone && showPhoneNumber && (
                  <p className="text-xs text-center text-muted-foreground">
                    Phone number not available
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* LinkedIn-Style Messaging System */}
      
      {/* Messaging Button - Always visible at bottom-right */}
      <div className="fixed bottom-4 right-6 z-50">
        <Button
          onClick={() => setShowMessagingPanel(!showMessagingPanel)}
          className="rounded-full h-12 px-4 gap-2 shadow-2xl"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium text-sm">Messaging</span>
          {conversations.length > 0 && (
            <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-xs">
              {conversations.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Messaging Panel - List of conversations */}
      {showMessagingPanel && (
        <div className="fixed bottom-20 right-6 w-72 bg-card border border-border rounded-lg shadow-2xl z-50 max-h-80 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-card">
            <h3 className="font-semibold text-sm">Messaging</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowMessagingPanel(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Conversations List */}
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No messages yet</p>
                <p className="text-xs mt-1 opacity-70">Start a conversation with a lawyer</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map(({ id, lawyer_id, lawyer, messages }) => (
                  <button
                    key={id}
                    onClick={() => {
                      const newOpenChats = new Set(openChats);
                      newOpenChats.add(lawyer_id);
                      setOpenChats(newOpenChats);
                    }}
                    className="w-full p-2.5 hover:bg-accent transition-colors text-left flex items-center gap-2"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={lawyer.avatar_url} alt={lawyer.name} />
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {lawyer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-xs truncate">{lawyer.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {messages.length > 0 
                          ? messages[messages.length - 1].text 
                          : 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Open Chat Windows */}
      {Array.from(openChats).map((lawyerId, index) => {
        const conversation = conversations.find(c => c.lawyer_id === lawyerId);
        if (!conversation) return null;
        
        const { lawyer, messages } = conversation;
        const isExpanded = expandedChats.has(lawyerId);
        const rightOffset = 350 + (index * 320); // Stack chat windows closer

        return (
          <div
            key={lawyerId}
            className={cn(
              "fixed bottom-4 bg-card border border-border rounded-lg shadow-2xl z-40 flex flex-col transition-all duration-300",
              isExpanded ? "w-[500px] h-[600px]" : "w-80 h-[450px]"
            )}
            style={{ right: `${rightOffset}px` }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-2.5 border-b bg-card">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={lawyer.avatar_url} alt={lawyer.name} />
                  <AvatarFallback className="bg-primary/10 text-xs">
                    {lawyer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-xs">{lawyer.name}</h4>
                  <span className="text-xs text-muted-foreground">{lawyer.specialization}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => isExpanded ? handleMinimizeChat(lawyerId) : handleMaximizeChat(lawyerId)}
                  title={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleCloseChat(lawyerId)}
                  title="Close"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-3 overflow-y-auto bg-muted/30">
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className={cn("text-muted-foreground", isExpanded ? "text-sm" : "text-xs")}>
                    Say hello to {lawyer.name.split(' ')[0]}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex",
                        msg.sender === 'me' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2",
                          isExpanded ? "text-sm" : "text-xs",
                          msg.sender === 'me'
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border"
                        )}
                      >
                        <p className="break-words">{msg.text}</p>
                        <p className={cn("opacity-70 mt-1", isExpanded ? "text-xs" : "text-[10px]")}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-card">
              <div className="flex gap-2">
                <Input
                  placeholder="Write a message..."
                  value={activeMessages.get(lawyerId) || ''}
                  onChange={(e) => {
                    const newActiveMessages = new Map(activeMessages);
                    newActiveMessages.set(lawyerId, e.target.value);
                    setActiveMessages(newActiveMessages);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && (activeMessages.get(lawyerId) || '').trim()) {
                      handleSendMessage(lawyerId);
                    }
                  }}
                  className={cn("flex-1", isExpanded ? "text-sm h-10" : "text-xs h-8")}
                />
                <Button
                  onClick={() => handleSendMessage(lawyerId)}
                  disabled={!(activeMessages.get(lawyerId) || '').trim()}
                  size="sm"
                  className={cn(isExpanded ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs")}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FindLawyers;
