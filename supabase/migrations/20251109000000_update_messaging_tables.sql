-- Migration to update existing messaging tables
-- This handles the case where cases, conversations, and lawyer_messages already exist

-- Step 1: Rename lawyer_messages to messages if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lawyer_messages') THEN
        -- Drop existing messages table if it exists
        DROP TABLE IF EXISTS public.messages CASCADE;
        
        -- Rename lawyer_messages to messages
        ALTER TABLE public.lawyer_messages RENAME TO messages;
        
        RAISE NOTICE 'Renamed lawyer_messages to messages';
    END IF;
END $$;

-- Step 2: Ensure messages table has all required columns
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'messages' 
                   AND column_name = 'is_case_request') THEN
        ALTER TABLE public.messages ADD COLUMN is_case_request BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'messages' 
                   AND column_name = 'delivered') THEN
        ALTER TABLE public.messages ADD COLUMN delivered BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'messages' 
                   AND column_name = 'read') THEN
        ALTER TABLE public.messages ADD COLUMN read BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Step 3: Ensure conversations table has all required columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'conversations' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.conversations ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'active', 'archived'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'conversations' 
                   AND column_name = 'last_message_at') THEN
        ALTER TABLE public.conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
    END IF;
END $$;

-- Step 4: Ensure cases table has all required columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'cases' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.cases ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'active', 'won', 'lost', 'closed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'cases' 
                   AND column_name = 'attachments') THEN
        ALTER TABLE public.cases ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Step 5: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON public.cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lawyer_id ON public.conversations(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Step 6: Drop existing policies before recreating (to avoid conflicts)
DO $$
BEGIN
    -- Drop existing RLS policies for cases
    DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
    DROP POLICY IF EXISTS "Clients can create cases" ON public.cases;
    DROP POLICY IF EXISTS "Lawyers can update their cases" ON public.cases;
    DROP POLICY IF EXISTS "Lawyers can create cases" ON public.cases;
    
    -- Drop existing RLS policies for conversations
    DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
    
    -- Drop existing RLS policies for messages
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
END $$;

-- Step 7: Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS Policies for cases
CREATE POLICY "Users can view their own cases"
  ON public.cases FOR SELECT
  USING (auth.uid() = lawyer_id OR auth.uid() = client_id);

CREATE POLICY "Lawyers can update their cases"
  ON public.cases FOR UPDATE
  USING (auth.uid() = lawyer_id);

CREATE POLICY "Lawyers can create cases"
  ON public.cases FOR INSERT
  WITH CHECK (auth.uid() = lawyer_id);

-- Step 9: Create RLS Policies for conversations
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = lawyer_id);

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = lawyer_id);

CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = lawyer_id);

-- Step 10: Create RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_id = auth.uid() OR conversations.lawyer_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_id
      AND (conversations.user_id = auth.uid() OR conversations.lawyer_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Step 11: Create or replace the trigger function for conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_conversation_on_message ON public.messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Step 13: Create or replace the trigger function for cases updated_at
CREATE OR REPLACE FUNCTION public.update_case_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Drop and recreate the trigger for cases
DROP TRIGGER IF EXISTS update_cases_updated_at ON public.cases;
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_case_updated_at();

-- Migration complete
DO $$ 
BEGIN
  RAISE NOTICE 'Migration completed successfully. All tables updated.';
END $$;
