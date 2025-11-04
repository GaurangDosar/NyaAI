# 🚀 Supabase Setup & Deployment Guide

## ✅ Current Status

**Project Status:** ✅ **RESUMED & VERIFIED**
- Database Schema: ✅ Correct (New schema with separate `user_roles` table)
- Edge Functions: ✅ All 4 functions ready to deploy
- Frontend Code: ✅ Fixed to match schema
- Storage Bucket: ⚠️ Needs verification

---

## 📋 Pre-Deployment Checklist

### 1. Install Supabase CLI

**Windows (PowerShell):**
```powershell
npm install -g supabase
```

**Verify installation:**
```powershell
supabase --version
```

---

### 2. Login to Supabase

```powershell
supabase login
```

This will open your browser for authentication.

---

### 3. Link Your Project

```powershell
cd d:\Projects\NyaAI
supabase link --project-ref gexdoytyemjzonxguvhv
```

**Expected output:**
```
Linked to project: gexdoytyemjzonxguvhv
```

---

## 🔑 Set Required Secrets

### Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy the key (starts with `sk-`)

### Set the Secret in Supabase

```powershell
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

**Verify secrets are set:**
```powershell
supabase secrets list
```

Expected output:
```
OPENAI_API_KEY
SUPABASE_URL (auto-set)
SUPABASE_ANON_KEY (auto-set)
```

---

## 🚀 Deploy Edge Functions

Deploy all 4 functions:

```powershell
# Deploy AI Lawyer Chat
supabase functions deploy ai-lawyer-chat

# Deploy Document Summarizer
supabase functions deploy document-summarizer

# Deploy Government Schemes Finder
supabase functions deploy government-schemes

# Deploy Lawyer Finder
supabase functions deploy lawyer-finder
```

**Alternative: Deploy all at once**
```powershell
supabase functions deploy
```

---

## 🗄️ Verify Database Schema

Run this in Supabase SQL Editor to confirm all tables exist:

```sql
-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- ✅ chat_messages
- ✅ chat_sessions
- ✅ documents
- ✅ government_schemes
- ✅ lawyer_profiles
- ✅ profiles
- ✅ scheme_applications
- ✅ user_roles

---

## 📦 Verify Storage Bucket

### Check if `documents` bucket exists:

1. Go to: https://app.supabase.com/project/gexdoytyemjzonxguvhv/storage/buckets
2. Look for `documents` bucket

### If bucket doesn't exist, create it:

```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
```

### Set Storage Policies:

```sql
-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🔐 Verify RLS Policies

Run this to check RLS is enabled on all tables:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`.

---

## 🧪 Test Edge Functions

### Test AI Lawyer Chat

```bash
curl -X POST \
  'https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/ai-lawyer-chat' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "What are tenant rights in India?",
    "sessionId": null
  }'
```

### Test Document Summarizer

```bash
curl -X POST \
  'https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/document-summarizer' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "documentId": "test-uuid",
    "content": "This is a sample legal document..."
  }'
```

### Test Government Schemes

```bash
curl -X POST \
  'https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/government-schemes' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "applicantName": "Test User",
    "age": 30,
    "gender": "male",
    "income": 400000,
    "occupation": "farmer",
    "location": "Mumbai"
  }'
```

### Test Lawyer Finder

```bash
curl -X POST \
  'https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/lawyer-finder' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "location": "Mumbai",
    "specialization": "Criminal Law"
  }'
```

---

## 🌐 Test Authentication Flow

### Create a test user:

1. Go to your app: http://localhost:5173/auth (after running `npm run dev`)
2. Sign up with test credentials
3. Check Supabase Dashboard → Authentication → Users

### Verify automatic profile creation:

```sql
-- Run in SQL Editor
SELECT 
  p.name,
  p.email,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC
LIMIT 5;
```

You should see the test user with their assigned role.

---

## 🐛 Troubleshooting

### Function deployment fails

**Error:** `Invalid project reference`
```powershell
supabase link --project-ref gexdoytyemjzonxguvhv
```

### OpenAI API returns 401

**Issue:** API key not set or invalid
```powershell
# Re-set the key
supabase secrets set OPENAI_API_KEY=sk-your-new-key
```

### RLS blocks legitimate queries

**Check policies:**
```sql
-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Storage upload fails

**Verify bucket exists and policies are set:**
```sql
-- Check buckets
SELECT * FROM storage.buckets;

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

---

## 📊 Monitor Function Logs

View real-time logs:

```powershell
# View logs for specific function
supabase functions logs ai-lawyer-chat --follow

# View all function logs
supabase functions logs --follow
```

**In Dashboard:**
Go to: https://app.supabase.com/project/gexdoytyemjzonxguvhv/functions

---

## ✅ Final Verification Checklist

Before moving to frontend development:

- [ ] Supabase project is resumed
- [ ] All 8 tables exist in database
- [ ] `documents` storage bucket exists with RLS
- [ ] RLS policies are enabled on all tables
- [ ] OpenAI API key is set in secrets
- [ ] All 4 Edge Functions are deployed
- [ ] Test user can sign up successfully
- [ ] Profile + role are auto-created on signup
- [ ] At least one Edge Function test passes

---

## 🎯 Next Steps

Once Supabase is fully set up:

1. ✅ **Backend is COMPLETE** - All Edge Functions ready
2. 🚧 **Frontend needs implementation:**
   - AI Chatbot UI
   - Document Upload UI
   - Government Schemes UI
   - Lawyer Finder UI

---

## 📞 Quick Reference

**Project Dashboard:** https://app.supabase.com/project/gexdoytyemjzonxguvhv
**API URL:** https://gexdoytyemjzonxguvhv.supabase.co
**Anon Key:** (from .env file)

**Edge Function URLs:**
- `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/ai-lawyer-chat`
- `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/document-summarizer`
- `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/government-schemes`
- `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/lawyer-finder`

---

**Last Updated:** November 2, 2025  
**Status:** Ready for deployment 🚀
