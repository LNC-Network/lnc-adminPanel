-- Supabase Auth Setup for LNC Admin Panel
-- Run this SQL in your Supabase SQL Editor after setting up the database

-- This script configures Supabase Auth with role-based access control

-- Step 1: Enable Row Level Security on auth.users (already enabled by default)

-- Step 2: Create a function to set user role during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- You can set default role here or through your application
  -- By default, new users will have 'user' role
  -- Admin users should be created manually or through a special endpoint
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create a trigger to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Create admin users
-- IMPORTANT: Replace 'your-secure-password' with a strong password
-- These users will be created in Supabase Auth system

-- Method 1: Create admin users via Supabase Dashboard
-- Go to Authentication → Users → Add User
-- Set email, password, and in user_metadata add: {"role": "admin"}

-- Method 2: Use SQL (requires enabling service role)
-- Note: You'll need to use Supabase Auth API for this, SQL can't directly create auth users

-- Step 5: Create a profiles table (optional but recommended)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admin users can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Step 6: Create a function to sync auth.users with profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile sync
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Step 7: Update content table to use auth.users
ALTER TABLE IF EXISTS content 
  DROP CONSTRAINT IF EXISTS content_uploaded_by_fkey;

ALTER TABLE IF EXISTS content
  ADD CONSTRAINT content_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) 
  REFERENCES auth.users(id);

-- Step 8: Update forms table to use auth.users
ALTER TABLE IF EXISTS forms
  DROP CONSTRAINT IF EXISTS forms_created_by_fkey;

ALTER TABLE IF EXISTS forms
  ADD CONSTRAINT forms_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id);

-- Step 9: Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create helper function to check if user is admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Drop the old adminpaneluser table (if exists)
-- Only run this after you've migrated all users to Supabase Auth
-- DROP TABLE IF EXISTS adminpaneluser CASCADE;

-- Instructions for creating admin users:
-- 
-- Via Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add user"
-- 3. Enter email and password
-- 4. Under "User Metadata" add: {"role": "admin"}
-- 5. Click "Create user"
-- 
-- Via Supabase API (recommended for automation):
-- Use the Admin API endpoint with your service role key
-- POST https://your-project.supabase.co/auth/v1/admin/users
-- Headers: 
--   Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--   Content-Type: application/json
-- Body:
-- {
--   "email": "admin@example.com",
--   "password": "secure-password",
--   "email_confirm": true,
--   "user_metadata": {
--     "role": "admin"
--   }
-- }

COMMENT ON TABLE profiles IS 'User profiles synced with Supabase Auth';
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user is admin';
COMMENT ON FUNCTION is_admin_or_editor() IS 'Helper function to check if current user is admin or editor';
