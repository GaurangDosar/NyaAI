-- Alternative: Update conversations table to reference profiles.user_id instead of auth.users.id
-- This should fix the foreign key constraint issue

-- First, check if we need to drop the existing foreign key
DO $$ 
BEGIN
  -- Drop existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_lawyer_id_fkey' 
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_lawyer_id_fkey;
  END IF;
END $$;

-- Add new foreign key that references profiles.user_id (not profiles.id)
-- This allows lawyer_id to be the auth user's UUID
ALTER TABLE conversations 
  ADD CONSTRAINT conversations_lawyer_id_fkey 
  FOREIGN KEY (lawyer_id) 
  REFERENCES profiles(user_id) 
  ON DELETE CASCADE;

-- Also ensure user_id references profiles.user_id
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_user_id_fkey' 
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_user_id_fkey;
  END IF;
END $$;

ALTER TABLE conversations 
  ADD CONSTRAINT conversations_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(user_id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT conversations_lawyer_id_fkey ON conversations IS 'References profiles.user_id (auth UUID), not profiles.id';
COMMENT ON CONSTRAINT conversations_user_id_fkey ON conversations IS 'References profiles.user_id (auth UUID), not profiles.id';
