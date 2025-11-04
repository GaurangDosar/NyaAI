-- Fix RLS policies for chat tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gexdoytyemjzonxguvhv/sql/new

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view messages from their own sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their own sessions" ON public.chat_messages;

-- Recreate policies with better performance
CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions" 
ON public.chat_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages from their own sessions" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE chat_sessions.id = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to their own sessions" 
ON public.chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE chat_sessions.id = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- Grant necessary permissions
GRANT ALL ON public.chat_sessions TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
