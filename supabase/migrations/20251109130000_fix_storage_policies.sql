-- Fix storage bucket policies for lawyer-chat-attachments
-- Allow authenticated users to upload and view files

-- Step 1: Ensure buckets exist and are public
DO $$
BEGIN
  -- Update/create lawyer-chat-attachments bucket
  UPDATE storage.buckets 
  SET public = true 
  WHERE id = 'lawyer-chat-attachments';
  
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('lawyer-chat-attachments', 'lawyer-chat-attachments', true);
  END IF;
  
  -- Update/create avatars bucket for profile pictures
  UPDATE storage.buckets 
  SET public = true 
  WHERE id = 'avatars';
  
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
  END IF;
END $$;

-- Step 2: Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all files in bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Step 3: Create upload policy
-- Allow authenticated users to upload files to their own user folder
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'lawyer-chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Create view policy for authenticated users
-- Allow authenticated users to view all files in the bucket (they might need to see lawyer attachments)
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lawyer-chat-attachments');

-- Step 5: Create public view policy (for downloading attachments)
-- Allow public access to view files (needed for download links)
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'lawyer-chat-attachments');

-- Step 6: Allow users to update their own files (for replacing attachments)
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'lawyer-chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 7: Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'lawyer-chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 8: Create policies for avatars bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to view avatars (public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verification
DO $$ 
BEGIN
  RAISE NOTICE 'Storage policies created successfully for lawyer-chat-attachments and avatars buckets';
END $$;
