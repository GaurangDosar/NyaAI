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

    // Create client with anon key to verify user
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

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { lawyer_id, text, attachments = [], is_case_request = false } = await req.json();

    if (!lawyer_id || !text?.trim()) {
      throw new Error('Missing required fields: lawyer_id and text');
    }

    console.log('Sending message from user', user.id, 'to lawyer', lawyer_id);

    // Check if conversation exists
    let { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('lawyer_id', lawyer_id)
      .maybeSingle();

    if (convError) {
      console.error('Error checking conversation:', convError);
    }

    // Create conversation if it doesn't exist
    if (!conversation) {
      const { data: newConv, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: user.id,
          lawyer_id: lawyer_id,
          status: is_case_request ? 'pending' : 'active',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw new Error('Failed to create conversation: ' + createError.message);
      }

      conversation = newConv;
    }

    // Insert message into lawyer_messages table
    const { data: message, error: messageError } = await supabaseAdmin
      .from('lawyer_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        text: text.trim(),
        attachments: attachments,
        is_case_request: is_case_request,
        delivered: true
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      throw new Error('Failed to send message: ' + messageError.message);
    }

    console.log('Message sent successfully:', message.id);

    return new Response(JSON.stringify({
      success: true,
      conversation_id: conversation.id,
      message: message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-message:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
