-- Upgrade Tickets System to GitHub-style Issues
-- Run this in Supabase SQL Editor

-- 1. Add issue_number (sequential like GitHub #123)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS issue_number SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_issue_number ON tickets(issue_number);

-- 2. Simplify status (GitHub has just open/closed)
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('open', 'closed'));

-- 3. Add labels support
CREATE TABLE IF NOT EXISTS ticket_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT '#808080',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Junction table for ticket-label relationships
CREATE TABLE IF NOT EXISTS ticket_label_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES ticket_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ticket_id, label_id)
);

-- 5. Milestones
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 6. Add milestone reference to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL;

-- 7. Reactions system (like GitHub)
CREATE TABLE IF NOT EXISTS ticket_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ticket_id, user_id, reaction)
);

-- 8. Comment reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES ticket_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction)
);

-- 9. Add locked field (prevent new comments when locked)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- 10. Add closed_by reference
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ticket_label_assignments_ticket_id ON ticket_label_assignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_label_assignments_label_id ON ticket_label_assignments(label_id);
CREATE INDEX IF NOT EXISTS idx_tickets_milestone_id ON tickets(milestone_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reactions_ticket_id ON ticket_reactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_milestones_state ON milestones(state);

-- Insert default labels (GitHub-style)
INSERT INTO ticket_labels (name, color, description) VALUES
    ('bug', '#d73a4a', 'Something isn''t working'),
    ('documentation', '#0075ca', 'Improvements or additions to documentation'),
    ('duplicate', '#cfd3d7', 'This issue or pull request already exists'),
    ('enhancement', '#a2eeef', 'New feature or request'),
    ('good first issue', '#7057ff', 'Good for newcomers'),
    ('help wanted', '#008672', 'Extra attention is needed'),
    ('invalid', '#e4e669', 'This doesn''t seem right'),
    ('question', '#d876e3', 'Further information is requested'),
    ('wontfix', '#ffffff', 'This will not be worked on')
ON CONFLICT (name) DO NOTHING;

-- Add comments
COMMENT ON TABLE ticket_labels IS 'GitHub-style labels for categorizing issues';
COMMENT ON TABLE milestones IS 'Group related issues into milestones';
COMMENT ON TABLE ticket_reactions IS 'Emoji reactions on tickets';
COMMENT ON TABLE comment_reactions IS 'Emoji reactions on comments';

-- Update existing tickets to have issue numbers
DO $$
DECLARE
    ticket_rec RECORD;
    counter INT := 1;
BEGIN
    FOR ticket_rec IN SELECT id FROM tickets ORDER BY created_at LOOP
        UPDATE tickets SET issue_number = counter WHERE id = ticket_rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

SELECT 'GitHub-style tickets upgrade complete!' as status;
