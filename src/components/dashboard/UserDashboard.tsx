import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare, Users, FileCheck, LogOut, History, Star, Search } from 'lucide-react';
import Navigation from '@/components/Navigation';
import DocumentUpload from './components/DocumentUpload';
import AIChat from './components/AIChat';
import GovernmentSchemes from './components/GovernmentSchemes';
import LawyerFinder from './components/LawyerFinder';
import Chat from './components/Chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const UserDashboard = () => {
  const { profile, signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [chatSessions, setChatSessions] = useState([]);
  const [contactedLawyers, setContactedLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);

  useEffect(() => {
    if (user) {
      loadChatSessions();
      loadContactedLawyers();
    }
  }, [user]);

  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setChatSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadContactedLawyers = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          lawyer_id,
          last_contacted,
          profiles!contacts_lawyer_id_fkey (
            name,
            email,
            specialization
          )
        `)
        .order('last_contacted', { ascending: false })
        .limit(5);

      if (error) throw error;
      setContactedLawyers(data || []);
    } catch (error) {
      console.error('Error loading contacted lawyers:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Spline 3D Background */}
      <div className="absolute inset-0 z-0">
        <iframe 
          src="https://my.spline.design/worldplanet-CMjrskBh7SPlIOLUf4luIIay/" 
          frameBorder="0" 
          width="100%" 
          height="100%"
          className="w-full h-full"
        />
      </div>
      <div className="absolute inset-0 bg-background/10 z-[1]" />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name}!</h1>
              <p className="text-muted-foreground">Access all your legal AI tools in one place</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Lawyer
            </TabsTrigger>
            <TabsTrigger value="lawyers" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Find Lawyers
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="schemes" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Gov Schemes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent AI Chat Sessions
                  </CardTitle>
                  <CardDescription>
                    Your recent conversations with the AI lawyer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chatSessions.length > 0 ? (
                    <div className="space-y-3">
                      {chatSessions.map((session) => (
                        <div key={session.id} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.updated_at).toLocaleDateString()}
                          </p>
                          {session.summary && (
                            <p className="text-sm mt-2">{session.summary}</p>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('chat')}
                      >
                        Start New Chat
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No chat sessions yet</p>
                      <Button onClick={() => setActiveTab('chat')}>
                        Start Your First Chat
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Contacted Lawyers
                  </CardTitle>
                  <CardDescription>
                    Lawyers you've previously contacted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contactedLawyers.length > 0 ? (
                    <div className="space-y-3">
                      {contactedLawyers.map((contact) => (
                        <div key={contact.lawyer_id} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{contact.profiles?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {contact.profiles?.specialization}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last contacted: {new Date(contact.last_contacted).toLocaleDateString()}
                          </p>
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => {
                              setSelectedLawyer(contact.lawyer_id);
                              setActiveTab('messages');
                            }}
                          >
                            Continue Chat
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('lawyers')}
                      >
                        Find More Lawyers
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No contacted lawyers yet</p>
                      <Button onClick={() => setActiveTab('lawyers')}>
                        Find Lawyers
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Legal Document Summarizer
                </CardTitle>
                <CardDescription>
                  Upload PDF or DOCX legal documents to get AI-powered summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Legal Consultation
                </CardTitle>
                <CardDescription>
                  Chat with our AI lawyer for legal guidance and advice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIChat />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schemes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Government Schemes Advisor
                </CardTitle>
                <CardDescription>
                  Find government schemes you're eligible for based on your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GovernmentSchemes />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lawyers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Lawyer Finder
                </CardTitle>
                <CardDescription>
                  Find qualified lawyers based on specialization and contact them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LawyerFinder onSelectLawyer={(lawyerId) => {
                  setSelectedLawyer(lawyerId);
                  setActiveTab('messages');
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Lawyer Chat
                </CardTitle>
                <CardDescription>
                  Communicate directly with lawyers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chat selectedLawyer={selectedLawyer} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;