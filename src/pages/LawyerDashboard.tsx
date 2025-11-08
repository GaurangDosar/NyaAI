import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  Paperclip,
  FileText,
  Download
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
  const [editingCase, setEditingCase] = useState(false);
  const [caseForm, setCaseForm] = useState({ title: '', description: '', status: 'pending' });
  
  // Client requests state
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [acceptForm, setAcceptForm] = useState({ title: '', description: '' });
  
  // Messaging state (for active conversations)
  const [activeConversations, setActiveConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
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
        
        // Load active conversations
        await loadActiveConversations();
        
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

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('lawyer-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Check if message is from a client (not from lawyer themselves)
          const isFromClient = newMessage.sender_id !== user.id;
          
          // Update active conversations with the new message
          setActiveConversations((prev) => {
            const convIndex = prev.findIndex(c => c.id === newMessage.conversation_id);
            if (convIndex >= 0) {
              const updated = [...prev];
              
              // Parse attachments if present
              let attachments = undefined;
              if (newMessage.attachments) {
                try {
                  const parsed = typeof newMessage.attachments === 'string' 
                    ? JSON.parse(newMessage.attachments) 
                    : newMessage.attachments;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    attachments = parsed;
                  }
                } catch (e) {
                  console.error('Error parsing attachments:', e);
                }
              }
              
              updated[convIndex] = {
                ...updated[convIndex],
                messages: [...updated[convIndex].messages, {
                  id: newMessage.id,
                  text: newMessage.text,
                  sender: newMessage.sender_id === user.id ? 'lawyer' : 'client',
                  timestamp: new Date(newMessage.created_at),
                  sender_id: newMessage.sender_id,
                  attachments
                }]
              };
              
              // Show notification if message is from client
              if (isFromClient) {
                setHasNewMessages(true);
                const caseTitle = updated[convIndex].caseTitle || 'A case';
                toast({
                  title: '💬 New Message',
                  description: `${caseTitle}: ${newMessage.text.substring(0, 50)}${newMessage.text.length > 50 ? '...' : ''}`,
                  duration: 5000,
                });
              }
              
              return updated;
            }
            return prev;
          });
          
          // Also update selected conversation if it matches
          setSelectedConversation(prev => {
            if (prev && prev.id === newMessage.conversation_id) {
              return {
                ...prev,
                messages: [...prev.messages, {
                  id: newMessage.id,
                  text: newMessage.text,
                  sender: newMessage.sender_id === user.id ? 'lawyer' : 'client',
                  timestamp: new Date(newMessage.created_at),
                  sender_id: newMessage.sender_id
                }]
              };
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
          .select('id, user_id, name, avatar_url, email')
          .in('user_id', clientIds);
        
        const convIds = convData.map((c: any) => c.id);
        const { data: messages } = await supabase
          .from('messages' as any)
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true });
        
        const formatted = convData.map((conv: any) => ({
          ...conv,
          client: clients?.find((cl: any) => cl.user_id === conv.user_id) || {
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

  const loadActiveConversations = async () => {
    if (!user) return;
    
    try {
      // Load conversations with status 'active' (approved)
      const { data: convData, error: convError } = await supabase
        .from('conversations' as any)
        .select('*')
        .eq('lawyer_id', user.id)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false });
      
      if (convError) {
        console.error('Error fetching conversations:', convError);
      }
      
      console.log('Conversations data:', convData);
      
      if (convData && convData.length > 0) {
        const clientIds = [...new Set(convData.map((c: any) => c.user_id))];
        const { data: clients, error: clientsError } = await supabase
          .from('profiles')
          .select('id, user_id, name, avatar_url, email')
          .in('user_id', clientIds);
        
        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
        }
        
        console.log('Fetched clients:', clients);
        console.log('Client IDs:', clientIds);
        
        // Fetch cases to get the case title for each conversation
        // Use the case_id from conversations to get the case details
        const caseIds = convData
          .map((c: any) => c.case_id)
          .filter((id: any) => id !== null);
        
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select('id, title, client_id, lawyer_id')
          .in('id', caseIds);
        
        if (casesError) {
          console.error('Error fetching cases:', casesError);
        }
        
        console.log('Fetched cases:', casesData);
        
        const convIds = convData.map((c: any) => c.id);
        const { data: messages } = await supabase
          .from('messages' as any)
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true });
        
        const formatted = convData.map((conv: any) => {
          const clientProfile = clients?.find((cl: any) => cl.user_id === conv.user_id);
          const client = {
            name: clientProfile?.name || clientProfile?.email?.split('@')[0] || 'Unknown User',
            avatar_url: clientProfile?.avatar_url || '',
            email: clientProfile?.email || '',
            user_id: conv.user_id
          };
          
          console.log('Conv user_id:', conv.user_id, 'Found profile:', clientProfile, 'Mapped client:', client);
          
          // Find the case associated with this conversation to get the title
          const associatedCase = casesData?.find((c: any) => c.id === conv.case_id);
          const caseTitle = associatedCase?.title || 'Untitled Case';
          
          const convMessages = messages?.filter((m: any) => m.conversation_id === conv.id).map((m: any) => {
            // Parse attachments
            let attachments = undefined;
            if (m.attachments) {
              try {
                const parsed = typeof m.attachments === 'string' ? JSON.parse(m.attachments) : m.attachments;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  attachments = parsed;
                }
              } catch (e) {
                console.error('Error parsing attachments:', e);
              }
            }
            
            return {
              id: m.id,
              text: m.text,
              sender: m.sender_id === user.id ? 'lawyer' : 'client',
              timestamp: new Date(m.created_at),
              sender_id: m.sender_id,
              attachments
            };
          }) || [];
          
          return {
            ...conv,
            client,
            caseTitle, // Add case title to conversation object
            messages: convMessages,
            unreadCount: 0 // Could add logic to count unread messages
          };
        });
        
        setActiveConversations(formatted);
      }
    } catch (error) {
      console.error('Error loading active conversations:', error);
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

  const handleUpdateCaseDetails = async () => {
    if (!selectedCase || !caseForm.title || !caseForm.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cases' as any)
        .update({
          title: caseForm.title,
          description: caseForm.description,
          status: caseForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCase.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Case details updated successfully',
      });
      
      setEditingCase(false);
      setSelectedCase(null);
      await loadCases();
    } catch (error) {
      console.error('Error updating case details:', error);
      toast({
        title: 'Error',
        description: 'Failed to update case details',
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

  const handleSendLawyerMessage = async (conversationId: string, attachments: any[] = []) => {
    if ((!newMessage.trim() && attachments.length === 0) || !user) return;
    
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({
            lawyer_id: user.id, // Even though we're the lawyer, we need to pass this
            text: newMessage,
            attachments: attachments,
            is_case_request: false,
            conversation_id: conversationId // Add this to identify existing conversation
          }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to send message');
      
      setNewMessage('');
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully',
      });
      
      // Reload conversations to get the new message
      await loadActiveConversations();
      
      // Update selected conversation if it's open
      if (selectedConversation && selectedConversation.id === conversationId) {
        const updated = activeConversations.find(c => c.id === conversationId);
        if (updated) {
          setSelectedConversation(updated);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedConversation || !user) return;

    // Validate file size (10MB max per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit`,
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingFile(true);

    try {
      const uploadedFiles = [];
      
      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${selectedConversation.client.user_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('lawyer-chat-attachments')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading file:', error);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: `Failed to upload ${file.name}`,
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('lawyer-chat-attachments')
          .getPublicUrl(fileName);

        uploadedFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
        });
      }

      if (uploadedFiles.length > 0) {
        await handleSendLawyerMessage(selectedConversation.id, uploadedFiles);
        toast({
          title: "Files Uploaded",
          description: `${uploadedFiles.length} file(s) sent successfully`,
        });
      }
    } catch (error: any) {
      console.error('Error in file upload:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "Failed to upload files",
      });
    } finally {
      setUploadingFile(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      let avatarUrl = profile?.avatar_url;
      
      // Upload avatar if a new file is selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });
        
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
            .getPublicUrl(fileName);
          
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Lawyer Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.name || 'Lawyer'}!</p>
          </div>
          {hasNewMessages && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg animate-pulse">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">New messages waiting</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="requests">Client Requests ({clientRequests.length})</TabsTrigger>
            <TabsTrigger value="messages" onClick={() => setHasNewMessages(false)}>
              <span className="flex items-center gap-2">
                Messages ({activeConversations.length})
                {hasNewMessages && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </span>
            </TabsTrigger>
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

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Active Conversations</CardTitle>
                  <CardDescription>{activeConversations.length} conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeConversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No active conversations</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full p-3 rounded-lg border transition-colors text-left ${
                            selectedConversation?.id === conv.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-accent border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={conv.client.avatar_url} />
                              <AvatarFallback>
                                {conv.client.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{conv.caseTitle}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                Client: {conv.client.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.messages.length > 0
                                  ? conv.messages[conv.messages.length - 1].text
                                  : 'No messages yet'}
                              </p>
                            </div>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-primary">{conv.unreadCount}</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chat Window */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {selectedConversation ? (
                      <>
                        <Avatar>
                          <AvatarImage src={selectedConversation.client.avatar_url} />
                          <AvatarFallback>
                            {selectedConversation.client.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{selectedConversation.caseTitle}</CardTitle>
                          <CardDescription>Client: {selectedConversation.client.name} ({selectedConversation.client.email})</CardDescription>
                        </div>
                      </>
                    ) : (
                      <CardTitle>Select a conversation</CardTitle>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <div className="space-y-4">
                      {/* Messages Area */}
                      <div className="h-[400px] overflow-y-auto bg-muted/30 rounded-lg p-4 space-y-3">
                        {selectedConversation.messages.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No messages yet</p>
                          </div>
                        ) : (
                          selectedConversation.messages.map((msg: any, idx: number) => (
                            <div
                              key={idx}
                              className={`flex ${msg.sender === 'lawyer' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                  msg.sender === 'lawyer'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card border'
                                }`}
                              >
                                <p className="text-sm">{msg.text}</p>
                                
                                {/* Display attachments if any */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {msg.attachments.map((attachment: any, attIdx: number) => (
                                      <a
                                        key={attIdx}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                          msg.sender === 'lawyer'
                                            ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
                                            : 'bg-muted/50 hover:bg-muted'
                                        }`}
                                      >
                                        <FileText className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-xs flex-1 truncate">
                                          {attachment.name}
                                        </span>
                                        <Download className="h-3 w-3 flex-shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="flex gap-2">
                        {/* Hidden file input */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                          className="hidden"
                        />
                        
                        {/* Paperclip button */}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                          title="Attach files"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          placeholder={uploadingFile ? "Uploading files..." : "Type your message..."}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          disabled={uploadingFile}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newMessage.trim()) {
                              handleSendLawyerMessage(selectedConversation.id);
                            }
                          }}
                        />
                        <Button
                          onClick={() => handleSendLawyerMessage(selectedConversation.id)}
                          disabled={!newMessage.trim() || uploadingFile}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p>Select a conversation to start messaging</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
      <Dialog open={!!selectedCase} onOpenChange={() => {
        setSelectedCase(null);
        setEditingCase(false);
        setCaseForm({ title: '', description: '', status: 'pending' });
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Case Details</DialogTitle>
              {!editingCase && selectedCase && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingCase(true);
                    setCaseForm({
                      title: selectedCase.title,
                      description: selectedCase.description,
                      status: selectedCase.status
                    });
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              )}
            </div>
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
                <div className="flex-1">
                  {editingCase ? (
                    <Input
                      value={caseForm.title}
                      onChange={(e) => setCaseForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Case title"
                      className="font-semibold"
                    />
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg">{selectedCase.title}</h3>
                      <p className="text-sm text-muted-foreground">{selectedCase.client.name}</p>
                    </>
                  )}
                </div>
                {editingCase ? (
                  <Select
                    value={caseForm.status}
                    onValueChange={(value) => setCaseForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-[140px]">
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
                ) : (
                  <Badge className="ml-auto" variant={
                    selectedCase.status === 'won' ? 'default' :
                    selectedCase.status === 'active' ? 'secondary' :
                    selectedCase.status === 'lost' ? 'destructive' :
                    'outline'
                  }>
                    {selectedCase.status}
                  </Badge>
                )}
              </div>
              
              <div>
                <Label>Description</Label>
                {editingCase ? (
                  <Textarea
                    value={caseForm.description}
                    onChange={(e) => setCaseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Case description"
                    rows={4}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{selectedCase.description}</p>
                )}
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

              {editingCase && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleUpdateCaseDetails}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCase(false);
                      setCaseForm({ title: '', description: '', status: 'pending' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
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
