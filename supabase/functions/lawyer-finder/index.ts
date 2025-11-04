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

    const { location, specialization } = await req.json();
    
    if (!location) {
      throw new Error('Location is required');
    }

    console.log('Finding lawyers for user:', user.id, 'in location:', location);

    // Build query for lawyers - JOIN profiles with lawyer_profiles and user_roles
    let query = supabaseClient
      .from('lawyer_profiles')
      .select(`
        id,
        user_id,
        specialization,
        license_number,
        experience_years,
        bio,
        availability,
        profiles!inner (
          name,
          email,
          phone,
          location,
          avatar_url
        )
      `)
      .eq('availability', true);

    // Filter by location (case-insensitive partial match)
    if (location) {
      query = query.ilike('profiles.location', `%${location}%`);
    }

    // Filter by specialization if provided
    if (specialization) {
      query = query.ilike('specialization', `%${specialization}%`);
    }

    const { data: lawyerData, error: lawyersError } = await query.limit(10);

    if (lawyersError) {
      throw new Error(`Database error: ${lawyersError.message}`);
    }

    // Format lawyer data for response (flatten the joined data)
    const formattedLawyers = (lawyerData || []).map(lawyer => ({
      id: lawyer.id,
      user_id: lawyer.user_id,
      name: lawyer.profiles?.name || 'Unknown',
      email: lawyer.profiles?.email || '',
      phone: lawyer.profiles?.phone || '',
      location: lawyer.profiles?.location || '',
      avatar_url: lawyer.profiles?.avatar_url || null,
      specialization: lawyer.specialization || '',
      experience_years: lawyer.experience_years || 0,
      license_number: lawyer.license_number || '',
      bio: lawyer.bio || '',
      availability: lawyer.availability
    }));

    // Use AI to enhance lawyer recommendations if we have results
    let enhancedLawyers = formattedLawyers;

    if (formattedLawyers.length > 0 && specialization) {
      try {
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
                content: 'You are a legal consultant AI that helps match clients with appropriate lawyers based on their specialization and needs.'
              },
              {
                role: 'user',
                content: `A client is looking for lawyers in ${location} with specialization in ${specialization}. 
                
                Here are the available lawyers: ${JSON.stringify(formattedLawyers)}
                
                Please provide a brief recommendation (under 50 words) for why each lawyer might be suitable for cases involving ${specialization}.`
              }
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (groqResponse.ok) {
          const aiResult = await groqResponse.json();
          const aiRecommendations = aiResult.choices[0].message.content;
          
          enhancedLawyers = formattedLawyers.map(lawyer => ({
            ...lawyer,
            ai_recommendation: aiRecommendations
          }));
        }
      } catch (aiError) {
        console.warn('AI enhancement failed:', aiError);
        // Continue without AI enhancement
      }
    }

    console.log(`Found ${formattedLawyers.length} lawyers for location: ${location}`);

    return new Response(JSON.stringify({ 
      success: true, 
      lawyers: enhancedLawyers,
      total_found: formattedLawyers.length,
      search_criteria: {
        location,
        specialization
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in lawyer-finder:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});