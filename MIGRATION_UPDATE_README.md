# Migration Update - November 9, 2025

## Issue
The original migration file (`20251108000000_create_messaging_and_cases.sql`) was trying to create tables and policies that already existed in your Supabase database, causing errors like:
```
ERROR: 42710: policy "Users can view their own cases" for table "cases" already exists
```

## Current Database State (Discovered)
Your Supabase database already has:
- ✅ `cases` table
- ✅ `conversations` table  
- ✅ `lawyer_messages` table (needs to be renamed to `messages`)

## Solution
Created a new migration file: **`20251109000000_update_messaging_tables.sql`**

This migration is **SAFE** to run on existing databases because it:

### 1. Handles Existing Tables
- Uses `IF EXISTS` checks before making changes
- Only adds columns that don't exist
- Renames `lawyer_messages` → `messages` if needed

### 2. Drops Policies Before Recreation
- Removes existing policies first (prevents "already exists" errors)
- Recreates them with correct names and permissions

### 3. Adds Missing Features
- Ensures all required columns exist:
  - `messages`: `is_case_request`, `delivered`, `read`
  - `conversations`: `status`, `last_message_at`
  - `cases`: `status`, `attachments`
- Creates necessary indexes
- Sets up triggers for auto-updates

## How to Apply

### Step 1: Run the New Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy contents from: `supabase/migrations/20251109000000_update_messaging_tables.sql`
3. Paste and run (Ctrl+Enter)
4. Wait for success message

### Step 2: Verify Changes
Check that you now have:
- `messages` table (renamed from `lawyer_messages`)
- All required columns in each table
- RLS policies properly set up

### Step 3: Create Storage Bucket
Follow the rest of `RUN_LAWYER_MESSAGING_MIGRATIONS.md`:
- Create `lawyer-chat-attachments` bucket
- Set up storage policies
- Deploy edge functions

## What Changed in Code

### Frontend (Already Updated)
- `src/pages/FindLawyers.tsx` now uses `messages` table (not `lawyer_messages`)
- Added attachment support

### Edge Function (Already Updated)
- `supabase/functions/send-message/index.ts` uses `messages` table

## Testing After Migration

1. **Verify tables**:
   - Check Table Editor shows `messages` (not `lawyer_messages`)
   - Verify all columns exist

2. **Test messaging**:
   - Search for a lawyer
   - Send a message
   - Check database: conversation and message created

3. **Test attachments**:
   - Click paperclip button
   - Upload a file
   - Verify it appears in message and storage bucket

## Rollback (If Needed)

If you need to revert:
```sql
-- Rename back to lawyer_messages
ALTER TABLE public.messages RENAME TO lawyer_messages;
```

## Files Updated
- ✅ `supabase/migrations/20251109000000_update_messaging_tables.sql` (NEW)
- ✅ `RUN_LAWYER_MESSAGING_MIGRATIONS.md` (updated to use new migration)
- ✅ `MIGRATION_UPDATE_README.md` (this file)

## Next Steps
1. Run the new migration: `20251109000000_update_messaging_tables.sql`
2. Create storage bucket (if not exists)
3. Deploy edge functions (if not deployed)
4. Test the messaging feature

That's it! The migration is now compatible with your existing database. 🚀
