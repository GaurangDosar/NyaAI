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

    const { location, specialization, minExperience, rating, sort, page } = await req.json();
    
    console.log('Finding lawyers with params:', { location, specialization, minExperience, rating, sort, page });

    // Build query for lawyer_profiles
    let lawyerQuery = supabaseClient
      .from('lawyer_profiles')
      .select('*', { count: 'exact' })
      .eq('availability', true);

    // Filter by specialization if provided
    if (specialization) {
      lawyerQuery = lawyerQuery.ilike('specialization', `%${specialization}%`);
    }

    // Filter by minimum experience
    if (minExperience && minExperience > 0) {
      lawyerQuery = lawyerQuery.gte('experience_years', minExperience);
    }

    // Apply sorting
    const sortColumn = sort === 'experience' ? 'experience_years' : 'created_at';
    const sortAscending = false;
    
    lawyerQuery = lawyerQuery.order(sortColumn, { ascending: sortAscending });

    // Apply pagination (12 per page)
    const currentPage = page || 1;
    const perPage = 12;
    const from = (currentPage - 1) * perPage;
    const to = from + perPage - 1;

    const { data: lawyerData, count, error: lawyersError } = await lawyerQuery.range(from, to);

    if (lawyersError) {
      throw new Error(`Database error: ${lawyersError.message}`);
    }

    if (!lawyerData || lawyerData.length === 0) {
      console.log('No lawyers found');
      return new Response(JSON.stringify({ 
        success: true, 
        lawyers: [],
        total: 0,
        page: currentPage,
        perPage: perPage,
        totalPages: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all user_ids from lawyer profiles
    const userIds = lawyerData.map((lawyer: any) => lawyer.user_id);

    // Fetch profiles for these users
    const { data: profilesData, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (profilesError) {
      throw new Error(`Profiles error: ${profilesError.message}`);
    }

    // Create a map of user_id -> profile
    const profilesMap = new Map();
    (profilesData || []).forEach((profile: any) => {
      profilesMap.set(profile.user_id, profile);
    });

    // Format lawyer data for response (join lawyer_profiles with profiles)
    const formattedLawyers = lawyerData.map((lawyer: any) => {
      const profile = profilesMap.get(lawyer.user_id);
      // Generate mock rating (between 4.0 and 5.0) based on experience
      const mockRating = 4.0 + (Math.min(lawyer.experience_years || 0, 15) / 15) * 1.0;
      
      return {
        id: lawyer.id,
        user_id: lawyer.user_id,
        name: profile?.name || 'Unknown',
        email: profile?.email || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        avatar_url: profile?.avatar_url || null,
        specialization: lawyer.specialization || '',
        experience_years: lawyer.experience_years || 0,
        license_number: lawyer.license_number || '',
        bio: lawyer.bio || '',
        rating: parseFloat(mockRating.toFixed(1)),
        availability: lawyer.availability
      };
    });

    // Filter by location if specified
    let filteredLawyers = formattedLawyers;
    if (location) {
      filteredLawyers = filteredLawyers.filter((lawyer: any) => 
        lawyer.location && lawyer.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Filter by rating if specified
    if (rating && rating > 0) {
      filteredLawyers = filteredLawyers.filter((lawyer: any) => lawyer.rating >= rating);
    }

    // Sort by name if requested
    if (sort === 'name') {
      filteredLawyers.sort((a: any, b: any) => a.name.localeCompare(b.name));
    } else if (sort === 'rating') {
      filteredLawyers.sort((a: any, b: any) => b.rating - a.rating);
    }

    console.log(`Found ${filteredLawyers.length} lawyers (total: ${count}) for page ${currentPage}`);

    return new Response(JSON.stringify({ 
      success: true, 
      lawyers: filteredLawyers,
      total: count || 0,
      page: currentPage,
      perPage: perPage,
      totalPages: Math.ceil((count || 0) / perPage)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in lawyer-finder:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});