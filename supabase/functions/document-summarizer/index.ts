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

    const { documentId, content } = await req.json();
    
    if (!documentId || !content) {
      throw new Error('Document ID and content are required');
    }

    console.log('Processing document summarization for user:', user.id);

    // Call OpenAI for summarization
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a legal expert AI that provides concise, professional summaries of legal documents. Focus on key legal points, obligations, rights, and important clauses. Structure your summary in bullet points for clarity.'
          },
          {
            role: 'user',
            content: `Please provide a comprehensive legal summary of this document:\n\n${content.substring(0, 15000)}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const aiResult = await openAIResponse.json();
    const summary = aiResult.choices[0].message.content;

    // Update document with summary
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ 
        summary,
        status: 'completed' 
      })
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log('Document summarization completed for document:', documentId);

    return new Response(JSON.stringify({ 
      success: true, 
      summary,
      documentId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in document-summarizer:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});