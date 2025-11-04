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

    const { 
      applicantName, 
      age, 
      gender, 
      income, 
      parentIncome,
      occupation, 
      state,
      areaType,
      caste,
      isDisabled,
      isMinority,
      isStudent
    } = await req.json();
    
    if (!applicantName || !age || !gender || !occupation || !state || !areaType) {
      throw new Error('All required fields must be provided');
    }

    console.log('Processing government schemes for user:', user.id);
    console.log('Input data:', { 
      applicantName, age, gender, income, parentIncome, occupation, state, areaType,
      caste, isDisabled, isMinority, isStudent
    });

    // Use Groq AI to generate eligible government schemes based on user profile
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
            content: `You are an expert on Indian government schemes and welfare programs. Your task is to identify and recommend suitable government schemes based on applicant profiles.

RESPONSE FORMAT:
Return a valid JSON array with 5-8 most relevant schemes. Each scheme must have this exact structure:
{
  "id": "unique-scheme-id",
  "name": "Official Scheme Name",
  "description": "Brief description (50-100 words)",
  "benefits": "Key benefits (50-100 words)",
  "category": "Category (Education/Health/Financial/Housing/Agriculture/Business/Pension/Social Welfare)",
  "eligibility": "Who can apply (30-50 words)",
  "howToApply": "Application process (50-100 words)",
  "documents": ["Document 1", "Document 2", "Document 3"],
  "deadline": "Application deadline or 'No deadline'",
  "officialWebsite": "Official website URL or 'Visit nearest government office'",
  "state": "Applicable state or 'All India'",
  "personalizedReason": "Why this scheme suits the applicant (50-80 words)"
}

IMPORTANT RULES:
1. Return ONLY valid JSON array, no markdown, no explanations
2. Include real, active Indian government schemes
3. Prioritize central government schemes, include 1-2 relevant state schemes if applicable
4. Consider ALL profile factors: age, gender, income, occupation, location
5. Provide accurate, helpful information
6. personalizedReason must explain why THIS applicant should apply`
          },
          {
            role: 'user',
            content: `Find eligible government schemes for this applicant:

Name: ${applicantName}
Age: ${age} years
Gender: ${gender}
Annual Income: ${income ? `₹${income}` : 'Not specified'}
Parent/Guardian Income: ${parentIncome ? `₹${parentIncome}` : 'Not specified'}
Occupation: ${occupation}
State: ${state}
Area Type: ${areaType} (Urban/Rural)
Caste Category: ${caste || 'Not specified'}
Person with Disability: ${isDisabled ? 'Yes' : 'No'}
Belongs to Minority: ${isMinority ? 'Yes' : 'No'}
Student Status: ${isStudent ? 'Yes - Currently a student' : 'No - Not a student'}

IMPORTANT: Consider ALL these factors when recommending schemes:
- Prioritize schemes for SC/ST/OBC/PVTG/DNT if applicable
- Include disability-specific schemes if person is disabled
- Include minority welfare schemes if applicable
- Include student scholarships and education schemes if student
- Consider parent income for student/dependent schemes
- Include caste-based reservations and benefits
- Include state-specific schemes for ${state}
- Consider ${areaType} area specific schemes (rural development, urban housing, etc.)
- Prioritize both central and state government schemes

Return JSON array of 6-10 most suitable schemes based on ALL eligibility criteria.`
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error('Groq API error:', errorData);
      throw new Error(`AI service error: ${groqResponse.statusText}`);
    }

    const aiResult = await groqResponse.json();
    const aiContent = aiResult.choices[0].message.content;
    
    console.log('AI Response:', aiContent);

    // Parse the AI response as JSON
    let schemes;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiContent;
      schemes = JSON.parse(jsonString);
      
      if (!Array.isArray(schemes)) {
        throw new Error('AI response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to generate schemes. Please try again.');
    }

    console.log(`Generated ${schemes.length} eligible schemes for user:`, user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      schemes: schemes,
      total_eligible: schemes.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in government-schemes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});