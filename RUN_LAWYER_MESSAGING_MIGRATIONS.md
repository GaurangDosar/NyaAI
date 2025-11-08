# Lawyer Messaging & Cases - Database Migration Instructions

This document provides step-by-step instructions to set up the database tables and storage bucket for the lawyer messaging and case management feature.

## Prerequisites

- Access to your Supabase project dashboard
- Admin privileges on the Supabase project

## Part 1: Run Database Migrations

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in with your credentials
3. Select your project: **NyaAI** (Project ID: gexdoytyemjzonxguvhv)

### Step 2: Run Migration for Conversations, Messages, and Cases

**IMPORTANT**: Use the new migration file that handles existing tables.

1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New Query"** button
3. Copy the **ENTIRE contents** from the file: `supabase/migrations/20251109000000_update_messaging_tables.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. Wait for the success message

**What this migration does**:
- Renames `lawyer_messages` table to `messages` (if it exists)
- Adds missing columns to existing tables
- Drops and recreates all RLS policies (to avoid conflicts)
- Creates necessary indexes and triggers

### Step 3: Verify Tables Were Created

1. In the left sidebar, click on **"Table Editor"**
2. You should now see three new tables:
   - **cases** - Stores legal cases between clients and lawyers
   - **conversations** - Stores conversation threads between users and lawyers
   - **messages** - Stores individual messages with attachments support

3. Click on each table to verify the structure:

#### `cases` table should have:
- id (uuid, primary key)
- lawyer_id (uuid, references auth.users)
- client_id (uuid, references auth.users)
- title (text)
- description (text)
- status (text: pending, active, won, lost, closed)
- attachments (jsonb)
- created_at, updated_at, closed_at (timestamptz)

#### `conversations` table should have:
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- lawyer_id (uuid, references auth.users)
- case_id (uuid, references cases, nullable)
- status (text: pending, active, archived)
- last_message_at (timestamptz)
- created_at (timestamptz)
- UNIQUE constraint on (user_id, lawyer_id)

#### `messages` table should have:
- id (uuid, primary key)
- conversation_id (uuid, references conversations)
- sender_id (uuid, references auth.users)
- text (text)
- attachments (jsonb - stores array of file metadata)
- is_case_request (boolean)
- delivered (boolean)
- read (boolean)
- created_at (timestamptz)

### Step 4: Verify RLS Policies

1. In the left sidebar, click on **"Authentication"** → **"Policies"**
2. Filter by table name to see policies for:
   - **cases**: Users can view/update their own cases
   - **conversations**: Users can view/create/update their conversations
   - **messages**: Users can view/send messages in their conversations

## Part 2: Create Storage Bucket for Attachments

### Step 1: Create Storage Bucket

1. In the left sidebar, click on **"Storage"**
2. Click **"Create a new bucket"**
3. Fill in the details:
   - **Name**: `lawyer-chat-attachments`
   - **Public bucket**: ✅ **Check this** (so users can download attachments)
   - **File size limit**: `10 MB` (or adjust as needed)
   - **Allowed MIME types**: Leave empty or add:
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `text/plain`
     - `image/jpeg`
     - `image/png`
     - `image/gif`
4. Click **"Create bucket"**

### Step 2: Set Up Storage Policies

1. After creating the bucket, click on **"Policies"** tab
2. Click **"New Policy"** and create two policies:

#### Policy 1: Allow authenticated users to upload files
```sql
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lawyer-chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Allow public read access to files
```sql
CREATE POLICY "Public can view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lawyer-chat-attachments');
```

3. Click **"Review"** and **"Save policy"** for each

## Part 3: Deploy Edge Functions (If Not Already Deployed)

### Step 1: Deploy send-message Function

```bash
cd d:\Projects\NyaAI
supabase functions deploy send-message
```

### Step 2: Deploy accept-case Function

```bash
supabase functions deploy accept-case
```

## Part 4: Verify Everything Works

### Test Checklist:

1. **Find Lawyers Page**:
   - [ ] Can search for lawyers
   - [ ] Can view lawyer profiles
   - [ ] "Send a request" button works

2. **Messaging**:
   - [ ] Click "Send a request" creates a conversation
   - [ ] Chat window opens at bottom-right
   - [ ] Can send text messages
   - [ ] Can attach files (PDF, DOC, images)
   - [ ] File uploads show progress ("Uploading...")
   - [ ] Attached files display in message bubble
   - [ ] Can click attachment to download/view

3. **Real-time Updates**:
   - [ ] New messages appear instantly
   - [ ] Conversation list updates
   - [ ] Attachments load properly

4. **Database**:
   - [ ] Check `conversations` table has entries
   - [ ] Check `messages` table has entries with attachments JSON
   - [ ] Check `lawyer-chat-attachments` bucket has uploaded files

## Troubleshooting

### Issue: Tables already exist
**Solution**: The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times. If you need to drop and recreate:
```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
```

### Issue: Storage bucket creation fails
**Solution**: 
- Bucket name must be unique across your project
- Try: `lawyer-chat-attachments-v2` if the original exists
- Update the bucket name in `src/pages/FindLawyers.tsx` (search for `lawyer-chat-attachments`)

### Issue: File upload returns 403 Forbidden
**Solution**:
- Check storage policies are created correctly
- Verify bucket is public
- Check user is authenticated

### Issue: Messages not appearing in real-time
**Solution**:
- Check browser console for WebSocket errors
- Verify Supabase Realtime is enabled for the `messages` table:
  1. Go to Database → Replication
  2. Find `messages` table
  3. Enable replication

## Migration Complete! 🎉

Your lawyer messaging and case management system is now ready to use. Users can:
- Search and connect with lawyers
- Send messages with file attachments (documents, images)
- Create case requests
- Lawyers can accept/reject cases from the LawyerDashboard page

## Foreign Key Constraints Verified

The following foreign key relationships are properly set up:

1. **cases.lawyer_id** → auth.users(id) ✅
2. **cases.client_id** → auth.users(id) ✅
3. **conversations.user_id** → auth.users(id) ✅
4. **conversations.lawyer_id** → auth.users(id) ✅
5. **conversations.case_id** → cases(id) ✅
6. **messages.conversation_id** → conversations(id) ✅
7. **messages.sender_id** → auth.users(id) ✅

All relationships have CASCADE or SET NULL on delete to maintain referential integrity.
