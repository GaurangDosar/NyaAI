-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'New Consultation' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for chat_messages
CREATE POLICY "Users can view messages from their own sessions" 
ON public.chat_messages 
FOR SELECT 
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to their own sessions" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
