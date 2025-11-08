-- Fix foreign key constraints to reference auth.users instead of profiles table
-- This migration ensures conversations can be created even if users don't have profile entries

-- Step 1: Drop existing foreign key constraints
DO $$ 
BEGIN
  -- Drop conversations foreign keys if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_user_id_fkey' 
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE public.conversations DROP CONSTRAINT conversations_user_id_fkey;
    RAISE NOTICE 'Dropped conversations_user_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_lawyer_id_fkey' 
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE public.conversations DROP CONSTRAINT conversations_lawyer_id_fkey;
    RAISE NOTICE 'Dropped conversations_lawyer_id_fkey';
  END IF;

  -- Drop cases foreign keys if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cases_lawyer_id_fkey' 
    AND table_name = 'cases'
  ) THEN
    ALTER TABLE public.cases DROP CONSTRAINT cases_lawyer_id_fkey;
    RAISE NOTICE 'Dropped cases_lawyer_id_fkey';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cases_client_id_fkey' 
    AND table_name = 'cases'
  ) THEN
    ALTER TABLE public.cases DROP CONSTRAINT cases_client_id_fkey;
    RAISE NOTICE 'Dropped cases_client_id_fkey';
  END IF;

  -- Drop messages foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_sender_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE public.messages DROP CONSTRAINT messages_sender_id_fkey;
    RAISE NOTICE 'Dropped messages_sender_id_fkey';
  END IF;
END $$;

-- Step 2: Create new foreign keys that reference auth.users
ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_lawyer_id_fkey 
  FOREIGN KEY (lawyer_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.cases 
  ADD CONSTRAINT cases_lawyer_id_fkey 
  FOREIGN KEY (lawyer_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.cases 
  ADD CONSTRAINT cases_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Step 3: Add comments explaining the change
COMMENT ON CONSTRAINT conversations_user_id_fkey ON public.conversations IS 
  'References auth.users(id) - allows conversations without profile entries';

COMMENT ON CONSTRAINT conversations_lawyer_id_fkey ON public.conversations IS 
  'References auth.users(id) - allows conversations without profile entries';

COMMENT ON CONSTRAINT cases_lawyer_id_fkey ON public.cases IS 
  'References auth.users(id) - allows cases without profile entries';

COMMENT ON CONSTRAINT cases_client_id_fkey ON public.cases IS 
  'References auth.users(id) - allows cases without profile entries';

COMMENT ON CONSTRAINT messages_sender_id_fkey ON public.messages IS 
  'References auth.users(id) - allows messages without profile entries';

-- Step 4: Verification
DO $$ 
BEGIN
  RAISE NOTICE 'Migration completed successfully. All foreign keys now reference auth.users';
END $$;
