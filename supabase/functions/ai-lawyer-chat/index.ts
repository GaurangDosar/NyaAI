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

    // Create client with service role for database operations (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create client with anon key for auth verification
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from JWT using anon client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { message, sessionId, stream } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Processing AI lawyer chat for user:', user.id, 'Stream:', stream);

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

    // Prepare conversation history for AI
    const conversationHistory = messageHistory || [];
    const messages = [
      {
        role: 'system',
        content: `You are NyaAI, an expert AI legal assistant specializing in Indian law and jurisprudence. Your mission is to democratize access to legal knowledge while maintaining the highest standards of accuracy and ethics.

CORE IDENTITY:
- You are helpful, professional, and empathetic
- You understand the complexity of legal matters and communicate clearly
- You acknowledge limitations and when professional counsel is necessary
- You respect user privacy and maintain confidentiality

RESPONSE FRAMEWORK:
1. **Understand Context**: First, clarify the legal issue at hand
2. **Legal Foundation**: Reference relevant Indian laws, acts, or sections when applicable
3. **Practical Guidance**: Provide clear, actionable steps
4. **Important Caveats**: Highlight critical considerations, exceptions, or risks
5. **Next Steps**: Suggest when to consult a lawyer or take specific action

LEGAL DOMAINS (Indian Law):
- Constitution of India and Fundamental Rights
- Civil Law (Contracts, Property, Family)
- Criminal Law (IPC, CrPC, Evidence Act)
- Consumer Protection
- Labour & Employment Law
- Corporate & Business Law
- Taxation (Income Tax, GST)
- Intellectual Property
- Cyber Law and IT Act

COMMUNICATION STYLE:
- Start responses with a brief empathetic acknowledgment
- Use structured formatting (bullet points, numbered lists)
- Define legal terms in simple language
- Use examples when helpful
- Be concise but comprehensive
- Always include: "⚖️ Legal Disclaimer: This is general information. For specific legal advice, consult a qualified lawyer."

WHEN TO ESCALATE:
- Serious criminal matters
- Complex litigation cases
- High-value financial disputes
- Cases requiring immediate legal action
- Matters involving minors or vulnerable persons

PROHIBITED:
- Never claim to replace a lawyer
- Never provide advice that could harm the user
- Never make definitive predictions about case outcomes
- Never request personal identification documents

Remember: Your goal is to empower users with legal knowledge while ensuring they understand when professional representation is essential.`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    // Call Groq for AI response
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 2000,
        temperature: 0.5,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.2,
        stream: stream || false,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.json();
      throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`);
    }

    // Handle streaming response
    if (stream && groqResponse.body) {
      const encoder = new TextEncoder();
      let fullResponse = '';

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            // Send session ID first
            const sessionData = `data: ${JSON.stringify({ sessionId: currentSessionId })}\n\n`;
            controller.enqueue(encoder.encode(sessionData));

            const reader = groqResponse.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      fullResponse += content;
                      // Send content chunk to client
                      const streamData = `data: ${JSON.stringify({ content })}\n\n`;
                      controller.enqueue(encoder.encode(streamData));
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for partial chunks
                  }
                }
              }
            }

            // Save complete AI response to database
            await supabaseClient
              .from('chat_messages')
              .insert({
                session_id: currentSessionId,
                role: 'assistant',
                content: fullResponse
              });

            // Send done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(streamResponse, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (fallback)
    const aiResult = await groqResponse.json();
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
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});