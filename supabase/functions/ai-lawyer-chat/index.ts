import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { message, sessionId } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Processing AI lawyer chat for user:', user.id);

    let currentSessionId = sessionId;

    // Create new session if none provided
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabaseClient
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: message.length > 50 ? message.substring(0, 47) + '...' : message
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Session creation error: ${sessionError.message}`);
      }

      currentSessionId = newSession.id;
    }

    // Save user message
    const { error: userMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        content: message
      });

    if (userMessageError) {
      throw new Error(`User message save error: ${userMessageError.message}`);
    }

    // Get chat history for context
    const { data: messageHistory, error: historyError } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.warn('Could not fetch message history:', historyError.message);
    }

    // Prepare conversation history for OpenAI
    const conversationHistory = messageHistory || [];
    const messages = [
      {
        role: 'system',
        content: `You are an expert AI legal assistant specializing in Indian law. Provide accurate, helpful legal guidance while being clear that you're an AI assistant and users should consult with qualified lawyers for specific legal matters. 

Key guidelines:
- Always preface advice with "As per Indian law" when applicable
- Be professional, empathetic, and clear
- Explain legal concepts in simple terms
- Suggest when users should seek professional legal counsel
- Stay current with Indian legal frameworks
- Focus on practical, actionable advice`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    // Call OpenAI for AI response
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const aiResult = await openAIResponse.json();
    const aiResponse = aiResult.choices[0].message.content;

    // Save AI response
    const { error: aiMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: aiResponse
      });

    if (aiMessageError) {
      throw new Error(`AI message save error: ${aiMessageError.message}`);
    }

    console.log('AI lawyer chat completed for session:', currentSessionId);

    return new Response(JSON.stringify({ 
      success: true, 
      response: aiResponse,
      sessionId: currentSessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-lawyer-chat:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});