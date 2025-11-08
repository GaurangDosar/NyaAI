-- Enable RLS on profiles table and add proper policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read access to lawyer profiles for discovery
CREATE POLICY "Anyone can view lawyer profiles for discovery" ON public.profiles
  FOR SELECT USING (role = 'lawyer');