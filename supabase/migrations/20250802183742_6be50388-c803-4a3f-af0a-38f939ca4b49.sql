-- Disable RLS as requested for educational purposes
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_logs DISABLE ROW LEVEL SECURITY;

-- Fix function search path
CREATE OR REPLACE FUNCTION update_lawyer_rating()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.lawyer_profiles 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM public.ratings 
      WHERE lawyer_id = NEW.lawyer_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM public.ratings 
      WHERE lawyer_id = NEW.lawyer_id
    )
  WHERE id = NEW.lawyer_id;
  
  RETURN NEW;
END;
$$;