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

    const requestBody = await req.json();
    console.log('Received request body keys:', Object.keys(requestBody));
    
    const { pdf_base64 } = requestBody;
    
    if (!pdf_base64) {
      throw new Error('PDF base64 content is required');
    }

    console.log('Processing document summarization for user:', user.id);
    console.log('Base64 length:', pdf_base64.length);

    // Decode base64 to get PDF text (simplified for testing - assumes text extraction done client-side)
    // In production, you'd use a PDF parsing library here
    let documentText = '';
    try {
      // For now, we'll assume the PDF content is passed as text or use a placeholder
      // In production, integrate with pdf-parse or similar
      documentText = atob(pdf_base64).substring(0, 30000); // Limit to ~30K chars for context
    } catch (e) {
      console.log('Using base64 directly as text representation');
      documentText = pdf_base64.substring(0, 30000);
    }

    console.log('Calling Groq API for legal document summarization...');

    // Call Groq API with comprehensive legal document prompt
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert legal document analyzer with years of experience in breaking down complex legal documents into simple, understandable summaries for everyday people.

Your task is to analyze legal documents and provide comprehensive summaries in plain, layman's language that anyone can understand - no legal jargon or complex terminology.

CRITICAL REQUIREMENTS:
1. Use simple, everyday language - explain as if talking to someone with no legal background
2. Use bullet points and clear structure for easy reading
3. Never skip important details - include ALL significant legal points
4. Highlight risks, obligations, rights, and important clauses
5. Explain consequences and implications in practical terms
6. Point out any red flags or unusual clauses
7. Include specific dates, amounts, deadlines, and parties involved
8. Organize information logically by topic


STRUCTURE YOUR SUMMARY AS FOLLOWS:

📄 DOCUMENT OVERVIEW
• What type of document is this? (in simple terms)
• Who are the parties involved?
• What is the main purpose or goal?
• When was it created/effective?

⚖️ KEY LEGAL POINTS
• What are the main legal obligations? (in plain English)
• What rights do the parties have?
• What are the core terms and conditions?

💰 FINANCIAL TERMS (if applicable)
• Payment amounts and schedules
• Fees, penalties, or costs
• Financial obligations or benefits

📅 IMPORTANT DATES & DEADLINES
• Start and end dates
• Renewal or termination dates
• Key deadlines to remember

✅ YOUR RIGHTS
• What can you do?
• What are you entitled to?
• What protections do you have?

❗ YOUR OBLIGATIONS
• What must you do?
• What are your responsibilities?
• What happens if you don't comply?

🚨 RISKS & RED FLAGS
• Potential problems or concerns
• Unusual or one-sided clauses
• Things to watch out for

⚠️ TERMINATION & BREACH
• How can this agreement end?
• What happens if someone breaks the rules?
• What are the consequences?

🔍 SPECIAL CLAUSES
• Any unique or noteworthy provisions
• Dispute resolution methods
• Confidentiality or non-compete clauses

💡 BOTTOM LINE
• Summary in 2-3 sentences: What does this mean for you?
• Should you be concerned about anything?
• Recommended next steps or actions

Remember: Assume the reader has ZERO legal knowledge. Explain everything clearly!`
          },
          {
            role: 'user',
            content: `Please analyze this legal document and provide a comprehensive summary following the structure outlined. Make sure to cover ALL important points and explain everything in simple, everyday language:\n\n${documentText}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    console.log('Groq Response status:', groqResponse.status);

    if (!groqResponse.ok) {
      let errorMessage = `Groq API error: ${groqResponse.status}`;
      let errorDetails = null;
      try {
        const errorData = await groqResponse.json();
        console.error('Groq error response:', errorData);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        const errorText = await groqResponse.text();
        console.error('Groq error text:', errorText);
        errorMessage = errorText || errorMessage;
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: errorMessage,
        error_details: errorDetails,
        status: groqResponse.status
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groqResult = await groqResponse.json();
    const summary = groqResult.choices?.[0]?.message?.content || 'No summary generated';
    
    console.log('Document summarization completed for user:', user.id);
    console.log('Summary length:', summary.length);

    return new Response(JSON.stringify({ 
      success: true, 
      summary: summary,
      model_used: 'llama-3.3-70b-versatile',
      raw_response: groqResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in document-summarizer:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
