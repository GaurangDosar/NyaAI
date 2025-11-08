-- Create saved_schemes table for storing AI-recommended schemes
CREATE TABLE IF NOT EXISTS public.saved_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheme_name text NOT NULL,
  scheme_description text,
  scheme_benefits text,
  scheme_category text,
  scheme_state text,
  scheme_eligibility text,
  scheme_how_to_apply text,
  scheme_documents text[],
  scheme_deadline text,
  scheme_official_website text,
  personalized_reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_schemes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own saved schemes
CREATE POLICY "Users can manage their own saved schemes" ON public.saved_schemes
  FOR ALL USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_schemes_user_id ON public.saved_schemes(user_id);
CREATE INDEX idx_saved_schemes_created_at ON public.saved_schemes(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_schemes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_schemes_updated_at
  BEFORE UPDATE ON public.saved_schemes
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_schemes_updated_at();
