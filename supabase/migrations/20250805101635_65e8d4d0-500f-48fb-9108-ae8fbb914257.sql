-- Fix remaining RLS issues by enabling RLS on all tables and updating policies

-- Enable RLS on remaining tables
ALTER TABLE public.chatbot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for chatbot_logs
CREATE POLICY "Users can view their own chatbot logs" ON public.chatbot_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chatbot logs" ON public.chatbot_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chatbot logs" ON public.chatbot_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for contacts
CREATE POLICY "Users can view their own contacts" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = lawyer_id);

CREATE POLICY "Users can create their own contacts" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = lawyer_id);

CREATE POLICY "Users can update their own contacts" ON public.contacts
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = lawyer_id);

-- RLS policies for lawyer_profiles (public read access for discovery)
CREATE POLICY "Anyone can view lawyer profiles" ON public.lawyer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Lawyers can create their own profile" ON public.lawyer_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Lawyers can update their own profile" ON public.lawyer_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS policies for messages
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create messages they send" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS policies for ratings
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);