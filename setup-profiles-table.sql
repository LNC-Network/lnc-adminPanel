-- Quick Setup: Create profiles table and trigger for Supabase Auth
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'user',
    display_name    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create trigger function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create profiles for existing users (if any)
INSERT INTO profiles (id, role, created_at, updated_at)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'role', 'user') as role,
    created_at,
    NOW() as updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 5. Enable RLS (optional but recommended)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for service role
CREATE POLICY "Service role can do everything" ON profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Success message
SELECT 'Profiles table created successfully!' as message;
