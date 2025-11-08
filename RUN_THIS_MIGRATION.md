# Database Migration Required

## Save Schemes Feature - Database Setup

To enable the "Save Scheme" functionality, you need to run the following SQL migration in your Supabase dashboard:

### Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **gexdoytyemjzonxguvhv**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of: `supabase/migrations/20251109000000_create_saved_schemes.sql`
6. Click **Run** or press `Ctrl+Enter`

### What this migration does:

- Creates a new `saved_schemes` table to store user-saved government schemes
- Sets up Row Level Security (RLS) so users can only see their own saved schemes
- Creates indexes for better query performance
- Adds an auto-update trigger for the `updated_at` timestamp

### After running the migration:

The "Save Scheme" button in the Government Schemes page will work, and saved schemes will appear in:
- The Dashboard under "Saved Schemes" section
- The "Schemes Saved" stat card will show the count

---

## Migration File Content:

```sql
-- Create saved_schemes table for storing AI-recommended schemes
CREATE TABLE IF NOT EXISTS public.saved_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheme_name text NOT NULL,
  scheme_description text,
  scheme_benefits text,
  scheme_category text,
  scheme_state text,
  scheme_eligibility text,
  scheme_how_to_apply text,
  scheme_documents text[],
  scheme_deadline text,
  scheme_official_website text,
  personalized_reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_schemes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own saved schemes
CREATE POLICY "Users can manage their own saved schemes" ON public.saved_schemes
  FOR ALL USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_schemes_user_id ON public.saved_schemes(user_id);
CREATE INDEX idx_saved_schemes_created_at ON public.saved_schemes(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_schemes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_schemes_updated_at
  BEFORE UPDATE ON public.saved_schemes
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_schemes_updated_at();
```
