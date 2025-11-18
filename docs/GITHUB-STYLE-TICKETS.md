# GitHub-Style Ticket System

## Overview
The ticket system has been upgraded to match GitHub's issue tracking system with modern features and better UX.

## ✨ New Features

### 1. **Issue Numbers**
- Sequential issue numbers like `#123`, `#456`
- Auto-incremented for each new issue
- Makes referencing issues easier

### 2. **Labels**
- Color-coded labels for categorization
- Default labels include:
  - 🐛 bug (red)
  - 📝 documentation (blue)
  - 🔄 duplicate (gray)
  - ✨ enhancement (cyan)
  - 🎓 good first issue (purple)
  - 🙏 help wanted (green)
  - ❌ invalid (yellow)
  - ❓ question (pink)
  - 🚫 wontfix (white)
- Add custom labels with any color
- Assign multiple labels per issue

### 3. **Milestones**
- Group related issues into milestones
- Track progress toward goals
- Set due dates
- Open/closed states

### 4. **Reactions**
- 8 emoji reactions (GitHub-style):
  - 👍 Thumbs up (+1)
  - 👎 Thumbs down (-1)
  - 😄 Laugh
  - 🎉 Hooray
  - 😕 Confused
  - ❤️ Heart
  - 🚀 Rocket
  - 👀 Eyes
- React to issues and comments
- See who reacted

### 5. **Simplified States**
- **Open**: Issue is active
- **Closed**: Issue is resolved/completed
- No more "in_progress", "resolved" confusion

### 6. **Better Commenting**
- Threaded conversations
- Markdown support (planned)
- Comment reactions
- Edit timestamps

### 7. **Lock Issues**
- Prevent further comments on locked issues
- Useful for archived/completed work

### 8. **Priority Levels**
- Low, Medium, High, Critical
- Visual indicators

### 9. **Better Filtering**
- Search by title
- Filter by status (open/closed)
- Filter by labels (planned)
- Filter by milestone (planned)
- Filter by assignee (planned)

## 📦 Database Schema

### New Tables
1. **ticket_labels** - Store label definitions
2. **ticket_label_assignments** - Link issues to labels
3. **milestones** - Project milestones
4. **ticket_reactions** - Reactions on issues
5. **comment_reactions** - Reactions on comments

### Updated Tables
- **tickets**:
  - Added `issue_number` (sequential ID)
  - Added `milestone_id` (link to milestone)
  - Added `is_locked` (prevent comments)
  - Added `closed_by` (who closed it)
  - Simplified `status` (open/closed only)

## 🚀 Setup Instructions

### Step 1: Run Database Migration
```bash
# In Supabase SQL Editor, run:
schemas/upgrade-tickets-to-github-style.sql
```

This will:
- Add new columns to tickets table
- Create labels, milestones, reactions tables
- Insert default labels
- Assign issue numbers to existing tickets
- Update status constraints

### Step 2: Update Component Import
Replace the old tickets component with the new one:

```typescript
// In components/dashboard/dashboard.tsx or wherever tickets are used
import Tickets from "./tickets-github"; // instead of "./tickets"
```

### Step 3: Verify API Endpoints
Make sure these endpoints exist:
- `GET/POST/DELETE /api/tickets/labels`
- `GET/POST /api/tickets/reactions`
- `GET/POST/PATCH/DELETE /api/tickets/milestones`

## 🎨 UI Improvements

### GitHub-Like Design
- Clean, minimal interface
- Issue list with status icons (🟢 open, 🟣 closed)
- Inline labels and metadata
- Avatar-based comments
- Reaction bar under descriptions/comments

### Better Navigation
- Tabs for open/closed issues
- Quick filters in header
- Search bar for finding issues
- One-click status toggle

### Responsive Design
- Works on mobile, tablet, desktop
- Collapsible sidebar (planned)
- Touch-friendly interactions

## 📝 Usage Examples

### Creating an Issue
1. Click "New issue" button
2. Fill in title and description
3. Select priority, milestone (optional)
4. Add labels (optional)
5. Assign users (optional)
6. Click "Create issue"

### Commenting
1. Open issue details
2. Type comment in textarea
3. Click "Comment"
4. Add reactions to any comment

### Reactions
1. Click emoji button under issue/comment
2. Click again to remove your reaction
3. Hover to see who reacted (planned)

### Closing Issues
1. Open issue details
2. Click "Close issue" button
3. Add closing comment (optional)
4. Issue marked as closed

### Labels
1. Create labels in settings (admin only)
2. Assign labels when creating issues
3. Filter issues by label

### Milestones
1. Create milestone with title, due date
2. Assign issues to milestone
3. Track completion percentage (planned)

## 🔧 API Reference

### Labels
```typescript
// Get all labels
GET /api/tickets/labels

// Create label
POST /api/tickets/labels
{
  name: "bug",
  color: "#d73a4a",
  description: "Something isn't working"
}

// Delete label
DELETE /api/tickets/labels?id=<label_id>
```

### Reactions
```typescript
// Add/remove reaction
POST /api/tickets/reactions
{
  ticket_id: "uuid",
  user_id: "uuid",
  reaction: "+1" // or -1, laugh, hooray, confused, heart, rocket, eyes
}

// Get reactions
GET /api/tickets/reactions?ticket_id=<ticket_id>
```

### Milestones
```typescript
// Get all milestones
GET /api/tickets/milestones

// Create milestone
POST /api/tickets/milestones
{
  title: "Version 2.0",
  description: "Next major release",
  due_date: "2025-12-31"
}

// Update milestone
PATCH /api/tickets/milestones
{
  id: "uuid",
  state: "closed"
}

// Delete milestone
DELETE /api/tickets/milestones?id=<milestone_id>
```

## 🎯 Roadmap

### Planned Features
- [ ] Markdown editor for descriptions/comments
- [ ] @mentions in comments
- [ ] File attachments
- [ ] Issue templates
- [ ] Saved filters
- [ ] Issue linking (#123 references)
- [ ] Activity timeline
- [ ] Email notifications
- [ ] Bulk operations
- [ ] Export issues
- [ ] Advanced search
- [ ] Custom fields

### Improvements
- [ ] Keyboard shortcuts (GitHub-style)
- [ ] Dark mode optimization
- [ ] Performance optimization
- [ ] Real-time updates
- [ ] Offline support

## 🐛 Migration Notes

### Existing Tickets
- All existing tickets get issue numbers automatically
- Status values are preserved if valid
- Invalid statuses are set to "open"
- No data loss during migration

### Backwards Compatibility
- Old ticket component still available as backup
- APIs support both old and new formats
- Database changes are additive (no drops)

## 📚 References

This system is inspired by:
- GitHub Issues
- GitLab Issues
- Linear
- Jira

---

**Status**: ✅ Core features implemented
**Next**: Run migration and test
