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

    const { applicantName, age, gender, income, occupation, location } = await req.json();
    
    if (!applicantName || !age || !gender || !occupation || !location) {
      throw new Error('All fields are required');
    }

    console.log('Processing government schemes for user:', user.id);

    // Get all schemes from database
    const { data: allSchemes, error: schemesError } = await supabaseClient
      .from('government_schemes')
      .select('*')
      .eq('is_active', true);

    if (schemesError) {
      throw new Error(`Database error: ${schemesError.message}`);
    }

    // Filter schemes based on eligibility criteria
    const eligibleSchemes = allSchemes.filter(scheme => {
      const criteria = scheme.eligibility_criteria;
      
      // Check age criteria
      if (criteria.age) {
        if (criteria.age.min && age < criteria.age.min) return false;
        if (criteria.age.max && age > criteria.age.max) return false;
      }
      
      // Check income criteria
      if (criteria.income && income) {
        if (criteria.income.max && income > criteria.income.max) return false;
        if (criteria.income.min && income < criteria.income.min) return false;
      }
      
      // Check gender criteria
      if (criteria.gender && criteria.gender !== gender) return false;
      
      // Check occupation criteria
      if (criteria.occupation && occupation !== criteria.occupation) return false;
      
      // Check land holding criteria (for farmers)
      if (criteria.land_holding && occupation === 'farmer') {
        // This would need additional land holding input in the form
        // For now, we'll assume all farmers qualify
      }
      
      return true;
    });

    // Save application record
    const schemeApplications = eligibleSchemes.map(scheme => ({
      user_id: user.id,
      scheme_id: scheme.id,
      applicant_name: applicantName,
      age,
      gender,
      income: income || null,
      occupation,
      location,
      status: 'suggested'
    }));

    if (schemeApplications.length > 0) {
      const { error: saveError } = await supabaseClient
        .from('scheme_applications')
        .insert(schemeApplications);

      if (saveError) {
        console.warn('Could not save scheme applications:', saveError.message);
      }
    }

    // Use AI to enhance recommendations
    const schemeDetails = eligibleSchemes.map(scheme => ({
      name: scheme.name,
      description: scheme.description,
      benefits: scheme.benefits,
      category: scheme.category
    }));

    let enhancedRecommendations = eligibleSchemes;

    if (eligibleSchemes.length > 0) {
      try {
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
                content: 'You are an expert on Indian government schemes. Provide personalized recommendations and explain why each scheme is suitable for the applicant.'
              },
              {
                role: 'user',
                content: `Given this applicant profile:
                Name: ${applicantName}
                Age: ${age}
                Gender: ${gender}
                Income: ${income || 'Not specified'}
                Occupation: ${occupation}
                Location: ${location}
                
                Here are the eligible schemes: ${JSON.stringify(schemeDetails)}
                
                Please provide a personalized explanation for each scheme explaining why it's beneficial for this applicant. Keep each explanation under 100 words.`
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (openAIResponse.ok) {
          const aiResult = await openAIResponse.json();
          const aiRecommendations = aiResult.choices[0].message.content;
          
          // Add AI recommendations to response
          enhancedRecommendations = eligibleSchemes.map(scheme => ({
            ...scheme,
            ai_recommendation: aiRecommendations
          }));
        }
      } catch (aiError) {
        console.warn('AI enhancement failed:', aiError);
        // Continue without AI enhancement
      }
    }

    console.log(`Found ${eligibleSchemes.length} eligible schemes for user:`, user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      schemes: enhancedRecommendations.slice(0, 5), // Return top 5 schemes
      total_eligible: eligibleSchemes.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in government-schemes:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});