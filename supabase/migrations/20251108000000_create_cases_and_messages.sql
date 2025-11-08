-- Create case status enum
CREATE TYPE case_status AS ENUM ('pending', 'active', 'won', 'lost', 'closed');

-- Create cases table
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lawyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status case_status DEFAULT 'pending' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  accepted_at timestamp with time zone,
  closed_at timestamp with time zone
);

-- Create conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lawyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  last_message_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, lawyer_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  read boolean DEFAULT false NOT NULL,
  is_case_request boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cases
CREATE POLICY "Users can view their own cases" ON public.cases
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id);

CREATE POLICY "Clients can create cases" ON public.cases
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Lawyers can update their cases" ON public.cases
  FOR UPDATE USING (auth.uid() = lawyer_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = lawyer_id);

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = lawyer_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = lawyer_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND (user_id = auth.uid() OR lawyer_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND (user_id = auth.uid() OR lawyer_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Create indexes for performance
CREATE INDEX idx_cases_lawyer_id ON public.cases(lawyer_id);
CREATE INDEX idx_cases_client_id ON public.cases(client_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_conversations_user_lawyer ON public.conversations(user_id, lawyer_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get lawyer stats
CREATE OR REPLACE FUNCTION get_lawyer_stats(lawyer_user_id uuid, time_period interval DEFAULT '30 days'::interval)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_cases', COUNT(DISTINCT c.id),
    'active_cases', COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END),
    'pending_cases', COUNT(DISTINCT CASE WHEN c.status = 'pending' THEN c.id END),
    'won_cases', COUNT(DISTINCT CASE WHEN c.status = 'won' THEN c.id END),
    'lost_cases', COUNT(DISTINCT CASE WHEN c.status = 'lost' THEN c.id END),
    'closed_cases', COUNT(DISTINCT CASE WHEN c.status = 'closed' THEN c.id END),
    'total_clients', COUNT(DISTINCT c.client_id),
    'total_messages', COUNT(DISTINCT m.id),
    'unread_messages', COUNT(DISTINCT CASE WHEN m.read = false AND m.sender_id != lawyer_user_id THEN m.id END)
  )
  INTO result
  FROM public.cases c
  LEFT JOIN public.conversations conv ON conv.lawyer_id = lawyer_user_id
  LEFT JOIN public.messages m ON m.conversation_id = conv.id
  WHERE c.lawyer_id = lawyer_user_id
    AND c.created_at >= NOW() - time_period;
  
  RETURN result;
END;
$$;
