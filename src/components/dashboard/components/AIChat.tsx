import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Loader } from 'lucide-react';

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

const AIChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions
  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const formattedSessions = (data || []).map(log => ({
        id: log.id,
        title: log.summary || 'AI Consultation',
        created_at: log.created_at
      }));
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    // For now, just show empty since we're using chatbot_logs for summaries
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const messageText = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to AI lawyer chat function
      const { data, error } = await supabase.functions.invoke('ai-lawyer-chat', {
        body: {
          message: messageText,
          sessionId: currentSessionId
        }
      });

      if (error) throw error;

      // Update session ID if new session was created
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
        await loadChatSessions(); // Refresh sessions list
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  return (
    <div className="space-y-4">
      {/* Session Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium">AI Legal Assistant</span>
        </div>
        <Button variant="outline" size="sm" onClick={startNewChat}>
          New Chat
        </Button>
      </div>

      {/* Chat Messages */}
      <Card className="h-96 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with our AI legal assistant</p>
                <p className="text-sm">Ask questions about Indian law, legal procedures, or get guidance on legal matters</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      )}
                      {message.role === 'user' && (
                        <User className="h-4 w-4 mt-0.5 text-primary-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a legal question..."
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Recent Conversations</h4>
          <div className="space-y-2">
            {sessions.slice(0, 3).map((session) => (
              <Card 
                key={session.id} 
                className={`cursor-pointer transition-colors ${
                  currentSessionId === session.id ? 'bg-primary/10' : ''
                }`}
                onClick={() => setCurrentSessionId(session.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{session.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;