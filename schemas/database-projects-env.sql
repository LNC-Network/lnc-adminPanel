-- Projects ENV Management Tables

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Environment Credentials table
CREATE TABLE IF NOT EXISTS env_credentials (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_env_credentials_project_id ON env_credentials(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Comments
COMMENT ON TABLE projects IS 'Stores development projects that contain environment credentials';
COMMENT ON TABLE env_credentials IS 'Stores encrypted environment variables and credentials for each project';
COMMENT ON COLUMN projects.password IS 'Password required to access project credentials';
COMMENT ON COLUMN env_credentials.key IS 'Environment variable key (e.g., DATABASE_URL, API_KEY)';
COMMENT ON COLUMN env_credentials.value IS 'Environment variable value (should be encrypted in production)';
