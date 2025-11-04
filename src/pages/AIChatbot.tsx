import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Bot, User, Loader2, Plus, Trash2, Shield, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const AIChatbot = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Temporarily disabled chat history to fix loading issues
  // Will re-enable once basic chat works
  useEffect(() => {
    // Skip loading sessions for now
    setLoadingSessions(false);
  }, [user]);

  const loadSessions = async () => {
    // Disabled for now - causing timeout issues
    setLoadingSessions(false);
    setSessions([]);
  };

  const loadMessages = async (sessionId: string) => {
    // Disabled for now
    setMessages([]);
  };

  const createNewSession = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user?.id,
          title: 'New Consultation'
        })
        .select()
        .single();

      if (error) {
        console.error('Session creation error:', error);
        throw error;
      }
      
      setSessions([data, ...sessions]);
      setCurrentSessionId(data.id);
      setMessages([]);
      
      toast({
        title: 'New Chat',
        description: 'Started a new consultation session'
      });
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create new session',
        variant: 'destructive'
      });
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      setSessions(sessions.filter(s => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(sessions[0]?.id || null);
        setMessages([]);
      }
      
      toast({
        title: 'Deleted',
        description: 'Chat session deleted'
      });
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive'
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      // Call the Edge Function (without session persistence for now)
      console.log('Sending message to AI...', { userMessage });
      
      let session;
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Got session:', data.session?.user?.email);
        if (error) {
          console.error('Session error:', error);
          throw error;
        }
        session = data.session;
      } catch (sessionError) {
        console.error('Failed to get session:', sessionError);
        throw new Error('Authentication error. Please refresh the page.');
      }
      
      if (!session?.access_token) {
        console.error('No access token in session');
        throw new Error('Not authenticated');
      }
      
      console.log('Making fetch request to Edge Function...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      let response;
      let result;
      try {
        response = await fetch(
          `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/ai-lawyer-chat`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: userMessage,
              sessionId: null  // No persistence for now
            }),
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        console.log('Response status:', response.status, response.statusText);
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Invalid response from server');
        }
        
        console.log('Parsed API Response:', result);

        if (!response.ok) {
          console.error('API Error:', result);
          throw new Error(result.error || `Server error: ${response.status}`);
        }
        
        if (!result.response) {
          throw new Error('No response from AI');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchError;
      }

      // Add AI response to messages (in-memory only, no persistence)
      const aiMessage: Message = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: result.response,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error('❌ CATCH BLOCK - Error sending message:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error));
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      });
      
      // Remove the temporary user message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      console.log('✅ FINALLY BLOCK - Setting isLoading to false');
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Purple radial gradients matching body theme */}
      <div className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, hsl(280 100% 60% / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, hsl(290 80% 70% / 0.15) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 opacity-20 z-[1]">
        <Shield className="h-12 w-12 text-primary animate-float" style={{ animationDelay: '0s' }} />
      </div>
      <div className="absolute top-40 right-20 opacity-20 z-[1]">
        <Brain className="h-16 w-16 text-accent animate-float" style={{ animationDelay: '1s' }} />
      </div>
      <div className="absolute bottom-40 left-20 opacity-20 z-[1]">
        <Sparkles className="h-10 w-10 text-primary-glow animate-float" style={{ animationDelay: '2s' }} />
      </div>
      <div className="absolute top-1/2 right-1/4 opacity-10 z-[1]">
        <Bot className="h-20 w-20 text-primary animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-4 h-screen flex flex-col">
        <div className="flex gap-4 flex-1 overflow-hidden mt-4">
          {/* Sidebar - Chat Sessions */}
          <Card className="w-80 glass hidden md:flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Chat History</CardTitle>
                <Button onClick={createNewSession} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              {loadingSessions ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No chat history yet. Start a new conversation!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full px-3">
                  <div className="space-y-2 py-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => setCurrentSessionId(session.id)}
                        className={cn(
                          "group p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/50",
                          currentSessionId === session.id && "bg-accent"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => deleteSession(session.id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Main Chat Area */}
          <Card className="flex-1 glass flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Legal Assistant</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about Indian law
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="h-16 w-16 text-primary/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to NyaAI Legal Assistant</h3>
                    <p className="text-muted-foreground max-w-md">
                      I'm here to help you understand Indian law. Ask me about your legal rights, 
                      procedures, or any legal questions you have.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 max-w-2xl">
                      <Button
                        variant="outline"
                        className="h-auto py-3 px-4 text-left justify-start"
                        onClick={() => setInput("What are my rights as a tenant in India?")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">What are my rights as a tenant?</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 px-4 text-left justify-start"
                        onClick={() => setInput("How do I file a consumer complaint?")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">How do I file a consumer complaint?</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 px-4 text-left justify-start"
                        onClick={() => setInput("What is the process for divorce in India?")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">What is the divorce process?</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-3 px-4 text-left justify-start"
                        onClick={() => setInput("Explain property inheritance laws")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Explain inheritance laws</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 animate-fade-in",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-primary/10">
                              <Bot className="h-4 w-4 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={cn(
                            "rounded-lg px-4 py-3 max-w-[80%]",
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {message.role === 'user' && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-secondary">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3 animate-fade-in">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg px-4 py-3 bg-accent">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-background/50">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your legal question..."
                    className="min-h-[60px] max-h-[200px] resize-none"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    size="lg"
                    className="px-6"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
