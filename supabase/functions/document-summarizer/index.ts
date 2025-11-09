import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Type, X-Stream-Status',
};

// AWS Summarizer endpoint
const AWS_SUMMARIZER_ENDPOINT = 'https://c6wexpmuxi.execute-api.us-east-1.amazonaws.com/summarize';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
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

    const requestBody = await req.json();
    console.log('Received request body keys:', Object.keys(requestBody));
    
    const { pdf_base64, stream = true } = requestBody;
    
    if (!pdf_base64) {
      throw new Error('PDF base64 content is required');
    }

    console.log('Processing document summarization for user:', user.id);
    console.log('Base64 length:', pdf_base64.length);
    console.log('Stream mode:', stream);

    // Prepare payload for AWS endpoint
    const awsPayload = {
      pdf_base64: pdf_base64,
      user_id: user.id
    };

    console.log('Calling AWS summarizer endpoint...');

    // Call AWS endpoint (acts as CORS proxy)
    const awsResponse = await fetch(AWS_SUMMARIZER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(awsPayload),
    });

    console.log('AWS Response status:', awsResponse.status);

    if (!awsResponse.ok) {
      let errorMessage = `AWS API error: ${awsResponse.status}`;
      let errorDetails = null;
      try {
        const errorData = await awsResponse.json();
        console.error('AWS error response:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        const errorText = await awsResponse.text();
        console.error('AWS error text:', errorText);
        errorMessage = errorText || errorMessage;
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: errorMessage,
        error_details: errorDetails,
        status: awsResponse.status
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if response has streaming content
    const contentType = awsResponse.headers.get('content-type') || '';
    
    // If AWS returns streaming response and client wants streaming
    if (stream && contentType.includes('text/event-stream')) {
      console.log('Proxying streaming response...');
      
      return new Response(awsResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Stream-Status': 'active',
        },
      });
    }

    // Otherwise, return complete JSON response
    const awsResult = await awsResponse.json();
    const summary = awsResult.summary || awsResult.result || awsResult.output || 'No summary generated';
    
    console.log('Document summarization completed for user:', user.id);
    console.log('Summary length:', typeof summary === 'string' ? summary.length : JSON.stringify(summary).length);

    return new Response(JSON.stringify({ 
      success: true, 
      summary: summary,
      model_used: awsResult.model_used || awsResult.model || 'AWS Custom Model',
      raw_response: awsResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in document-summarizer:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
