# 🗄️ NyaAI Supabase Structure & Configuration

**Project ID:** `gexdoytyemjzonxguvhv`  
**Project URL:** `https://gexdoytyemjzonxguvhv.supabase.co`  
**Status:** ⚠️ Paused (needs to be resumed)

---

## 📊 Database Schema

### **Core Tables**

#### 1. **`profiles`** - User Basic Information
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  location text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```
**Purpose:** Stores basic profile info for all users  
**RLS:** Enabled - Users can view/update own profile, all profiles are publicly viewable

---

#### 2. **`user_roles`** - Role Management
```sql
CREATE TYPE public.app_role AS ENUM ('user', 'lawyer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);
```
**Purpose:** Security-separated role assignment  
**RLS:** Enabled - Users can only view their own roles

---

#### 3. **`lawyer_profiles`** - Lawyer Extended Information
```sql
CREATE TABLE public.lawyer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  specialization text,           -- e.g., "Criminal Law", "Corporate Law"
  license_number text,
  experience_years integer,
  bio text,
  availability boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```
**Purpose:** Additional professional details for lawyers  
**RLS:** Enabled - Lawyers can update own profile, all profiles publicly viewable for search

---

#### 4. **`documents`** - Legal Document Storage
```sql
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  file_path text,                -- Supabase Storage path
  content text,                  -- Extracted text content
  summary text,                  -- AI-generated summary
  status text DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'failed'
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```
**Purpose:** Track uploaded documents and their AI summaries  
**RLS:** Enabled - Users can only manage their own documents

---

#### 5. **`chat_sessions`** - AI Chat Sessions
```sql
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'Legal Consultation',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```
**Purpose:** Group chat messages into conversation sessions  
**RLS:** Enabled - Users can only access their own sessions

---

#### 6. **`chat_messages`** - AI Chat Messages
```sql
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```
**Purpose:** Individual messages in chat sessions  
**RLS:** Enabled - Users can only view/insert messages in their own sessions

---

#### 7. **`government_schemes`** - Available Government Schemes
```sql
CREATE TABLE public.government_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  benefits text NOT NULL,
  eligibility_criteria jsonb NOT NULL,
  application_process text,
  category text,
  state text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```
**Purpose:** Database of government schemes with eligibility rules  
**RLS:** Public read access for active schemes  
**Sample Data:** 4 pre-populated schemes (Pradhan Mantri Awas Yojana, PM Kisan, Ayushman Bharat, Beti Bachao Beti Padhao)

---

#### 8. **`scheme_applications`** - User Scheme Applications
```sql
CREATE TABLE public.scheme_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheme_id uuid REFERENCES public.government_schemes(id) NOT NULL,
  applicant_name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  income decimal,
  occupation text,
  location text,
  status text DEFAULT 'suggested', -- 'suggested', 'applied', 'approved', 'rejected'
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```
**Purpose:** Track user applications to schemes  
**RLS:** Enabled - Users can only view/insert their own applications

---

## 🗄️ Storage Buckets

### **`documents`** Bucket
- **Public:** No (Private)
- **Purpose:** Store user uploaded legal documents
- **File Structure:** `{user_id}/{file_name}`
- **RLS Policies:**
  - Users can upload to their own folder
  - Users can view their own documents
  - Users can update/delete their own documents

---

## 🔐 Authentication & Security

### **Authentication Flow**
1. User signs up via email/password
2. **Trigger:** `on_auth_user_created` automatically creates:
   - Profile record in `profiles`
   - Role record in `user_roles`
   - Lawyer profile in `lawyer_profiles` (if role = 'lawyer')

### **Security Functions**
```sql
-- Check if user has specific role
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
```

### **Triggers**
- `update_profiles_updated_at` - Auto-update timestamp on profile changes
- `update_lawyer_profiles_updated_at` - Auto-update timestamp on lawyer profile changes
- `update_documents_updated_at` - Auto-update timestamp on document changes
- `update_chat_sessions_updated_at` - Auto-update timestamp on session changes

---

## ⚡ Edge Functions

### **1. ai-lawyer-chat** ✅ Ready
**Endpoint:** `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/ai-lawyer-chat`

**Features:**
- OpenAI GPT-4o-mini integration
- Conversation history management
- Session creation/continuation
- Legal domain system prompt
- Error handling with CORS

**Required Secrets:**
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Request Format:**
```json
{
  "message": "What are my rights as a tenant?",
  "sessionId": "uuid-or-null"
}
```

**Response Format:**
```json
{
  "success": true,
  "response": "AI response text...",
  "sessionId": "session-uuid"
}
```

---

### **2. document-summarizer** ✅ Ready
**Endpoint:** `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/document-summarizer`

**Features:**
- OpenAI GPT-4o-mini for summarization
- Updates document status to 'completed'
- Structured bullet-point summaries
- Handles up to 15,000 characters

**Request Format:**
```json
{
  "documentId": "uuid",
  "content": "Full document text..."
}
```

**Response Format:**
```json
{
  "success": true,
  "summary": "AI summary...",
  "documentId": "uuid"
}
```

---

### **3. government-schemes** ✅ Ready
**Endpoint:** `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/government-schemes`

**Features:**
- Eligibility matching algorithm
- AI-enhanced recommendations
- Auto-saves application records
- Filters by age, income, gender, occupation

**Request Format:**
```json
{
  "applicantName": "John Doe",
  "age": 30,
  "gender": "male",
  "income": 400000,
  "occupation": "farmer",
  "location": "Mumbai"
}
```

**Response Format:**
```json
{
  "success": true,
  "schemes": [...],
  "total_eligible": 3
}
```

---

### **4. lawyer-finder** ✅ Ready
**Endpoint:** `https://gexdoytyemjzonxguvhv.supabase.co/functions/v1/lawyer-finder`

**Features:**
- Location-based search (case-insensitive partial match)
- Specialization filtering
- AI-enhanced lawyer recommendations
- Returns top 10 results

**Request Format:**
```json
{
  "location": "Mumbai",
  "specialization": "Criminal Law"
}
```

**Response Format:**
```json
{
  "success": true,
  "lawyers": [...],
  "total_found": 5,
  "search_criteria": {...}
}
```

---

## 🔧 Environment Variables

### **Client-side (.env)**
```env
VITE_SUPABASE_PROJECT_ID="gexdoytyemjzonxguvhv"
VITE_SUPABASE_URL="https://gexdoytyemjzonxguvhv.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
```

### **Supabase Edge Functions (Secrets)**
⚠️ **Required Secrets to Set:**
```bash
# Set via Supabase Dashboard or CLI
OPENAI_API_KEY=sk-...         # OpenAI API key
SUPABASE_URL=https://...      # Auto-set by Supabase
SUPABASE_ANON_KEY=eyJ...      # Auto-set by Supabase
```

---

## 📝 Migration History

Total Migrations: **12**

**Latest Migration:** `20251002063146_5d73cbad-aff1-4b07-bd65-d2f09324477a.sql`
- Complete schema restructure
- Separated roles into dedicated table
- Added security definer functions
- Implemented proper RLS policies

---

## ✅ Checklist: Resume Supabase Project

Since your Supabase project is **paused**, here's what you need to do:

### **1. Resume Project**
```bash
# Go to Supabase Dashboard
# https://app.supabase.com/project/gexdoytyemjzonxguvhv
# Click "Resume Project" button
```

### **2. Verify Database Tables**
```sql
-- Run in SQL Editor to check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Expected tables:
- ✅ profiles
- ✅ user_roles
- ✅ lawyer_profiles
- ✅ documents
- ✅ chat_sessions
- ✅ chat_messages
- ✅ government_schemes
- ✅ scheme_applications

### **3. Set Edge Function Secrets**
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref gexdoytyemjzonxguvhv

# Set OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-your-openai-key-here
```

### **4. Deploy Edge Functions**
```bash
# Deploy all functions
supabase functions deploy ai-lawyer-chat
supabase functions deploy document-summarizer
supabase functions deploy government-schemes
supabase functions deploy lawyer-finder
```

### **5. Verify Storage Bucket**
- Go to Storage section in Supabase Dashboard
- Confirm `documents` bucket exists
- Verify RLS policies are active

### **6. Test Authentication**
```bash
# Try signing up a test user
# Check if trigger creates profile + role automatically
```

---

## 🔍 Current Issues to Fix

### **⚠️ Schema Inconsistencies**

The database has been restructured, but the old schema had:
- `role` column in `profiles` table
- Combined profile information

The **new schema** (latest migration) has:
- Separate `user_roles` table
- Split `lawyer_profiles` table

**Action Required:**
- Verify which schema is currently active in Supabase
- Update frontend code to match current schema
- Current frontend `AuthContext.tsx` expects old schema

### **🔧 Frontend-Backend Mismatch**

**Issue:** `AuthContext.tsx` queries:
```typescript
.from('profiles')
.select('*')
.eq('user_id', userId)
```

But the new schema doesn't have `role` in profiles.

**Fix Required:** Update `AuthContext.tsx` to:
```typescript
// Query profiles
const { data: profileData } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Query role separately
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();
```

---

## 🚀 Next Steps

1. **Resume Supabase Project** in dashboard
2. **Run schema verification** query
3. **Set OPENAI_API_KEY** secret
4. **Deploy all Edge Functions**
5. **Fix frontend AuthContext** to match new schema
6. **Test authentication flow** end-to-end
7. **Verify RLS policies** are working

---

## 📞 Support

- **Supabase Dashboard:** https://app.supabase.com/project/gexdoytyemjzonxguvhv
- **Supabase Docs:** https://supabase.com/docs
- **Edge Functions Docs:** https://supabase.com/docs/guides/functions

---

**Last Updated:** November 2, 2025  
**Schema Version:** v2 (Separated roles)
