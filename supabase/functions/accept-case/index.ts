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

    const { conversation_id, accepted, title, description } = await req.json();

    if (!conversation_id || accepted === undefined) {
      throw new Error('Missing required fields: conversation_id and accepted');
    }

    console.log('Lawyer', user.id, accepted ? 'accepting' : 'rejecting', 'case request for conversation', conversation_id);

    // Get conversation
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .eq('lawyer_id', user.id)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found or unauthorized');
    }

    if (accepted) {
      // Create case
      const { data: newCase, error: caseError } = await supabaseClient
        .from('cases')
        .insert({
          lawyer_id: user.id,
          client_id: conversation.user_id,
          title: title || 'New Case',
          description: description || '',
          status: 'active'
        })
        .select()
        .single();

      if (caseError) {
        console.error('Error creating case:', caseError);
        throw new Error('Failed to create case');
      }

      // Update conversation with case_id and set to active
      const { error: updateError } = await supabaseClient
        .from('conversations')
        .update({
          case_id: newCase.id,
          status: 'active'
        })
        .eq('id', conversation_id);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
        throw new Error('Failed to update conversation');
      }

      // Send acceptance message
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversation_id,
          sender_id: user.id,
          text: `I have accepted your case request. Let's discuss the details.`,
          delivered: true
        });

      console.log('Case created successfully:', newCase.id);

      return new Response(JSON.stringify({
        success: true,
        accepted: true,
        case: newCase
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Update conversation status to archived
      await supabaseClient
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversation_id);

      // Send rejection message
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversation_id,
          sender_id: user.id,
          text: `I'm unable to take on this case at the moment. Thank you for reaching out.`,
          delivered: true
        });

      console.log('Case request rejected for conversation:', conversation_id);

      return new Response(JSON.stringify({
        success: true,
        accepted: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in accept-case:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
