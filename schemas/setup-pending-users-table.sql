-- Pending Users Registration Table
-- Run this in Supabase SQL Editor to create the pending users table

-- Pending Users table (for registration requests)
CREATE TABLE IF NOT EXISTS pending_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    team TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_users_status ON pending_users(status);
CREATE INDEX IF NOT EXISTS idx_pending_users_email ON pending_users(email);
CREATE INDEX IF NOT EXISTS idx_pending_users_submitted_at ON pending_users(submitted_at DESC);

COMMENT ON TABLE pending_users IS 'Stores new user registration requests pending admin approval';
COMMENT ON COLUMN pending_users.team IS 'The team/department the user wants to join';
COMMENT ON COLUMN pending_users.status IS 'Registration status: pending, approved, or rejected';
