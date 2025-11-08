-- Drop user_profiles table (not needed - using profiles table instead)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Clean up any related functions
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;

-- Add comment
COMMENT ON TABLE profiles IS 'Central profiles table for all users (both regular users and lawyers). Use user_roles table to determine role.';

