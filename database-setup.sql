-- LNC Admin Panel Database Setup
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create the admin users table
CREATE TABLE IF NOT EXISTS adminpaneluser (
  user_id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_adminpaneluser_email ON adminpaneluser(user_email);

-- Insert default admin user (CHANGE THESE CREDENTIALS!)
INSERT INTO adminpaneluser (user_email, user_password) 
VALUES ('admin@example.com', 'admin123')
ON CONFLICT (user_email) DO NOTHING;

-- Optional: Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_adminpaneluser_updated_at 
BEFORE UPDATE ON adminpaneluser 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create additional tables for content management

-- Content table for media files
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  size BIGINT,
  url TEXT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INTEGER REFERENCES adminpaneluser(user_id)
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB,
  created_by INTEGER REFERENCES adminpaneluser(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft'
);

-- Form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_upload_date ON content(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC);

-- Grant necessary permissions (adjust based on your Supabase setup)
-- Note: Supabase handles most permissions automatically through RLS

COMMENT ON TABLE adminpaneluser IS 'Stores admin user credentials for the admin panel';
COMMENT ON TABLE content IS 'Stores uploaded media files and documents';
COMMENT ON TABLE forms IS 'Stores form configurations created in the form builder';
COMMENT ON TABLE form_submissions IS 'Stores all form submission data';
