-- Temporarily disable RLS to fix the timeout issue
-- Run this in Supabase SQL Editor

-- Disable RLS (temporarily for testing)
ALTER TABLE public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS but make it work, use this instead:
-- First, make sure the tables allow anon access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO anon, authenticated;
