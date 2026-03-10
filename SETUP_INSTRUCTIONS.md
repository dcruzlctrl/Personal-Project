# Project Dashboard + Habits Tracker - Setup & Deployment Guide

## Quick Start (30 minutes)

### Step 1: Supabase Setup (5 minutes)

1. Go to https://supabase.com and sign up (use GitHub for fastest signup)
2. Create a new project and wait for it to initialize
3. Once ready, go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxx.supabase.co`)
   - **Public API Key** (under anon key)
4. Save these - you'll need them in Step 3

### Step 2: Create Database Tables

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Copy and paste ALL of this SQL, then click **Run**:

```sql
-- ===== PROJECTS & TASKS TABLES =====

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create file_uploads table
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  file_url TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ===== HABITS TABLES =====

-- Create habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create habit_logs table (detailed tracking)
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  change INT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Enable RLS for all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- ===== PROJECTS POLICIES =====

CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- ===== TASKS POLICIES =====

CREATE POLICY "Users can view tasks in their projects" ON tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can insert tasks in their projects" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update tasks in their projects" ON tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete tasks in their projects" ON tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );

-- ===== FILE_UPLOADS POLICIES =====

CREATE POLICY "Users can view files in their projects" ON file_uploads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = file_uploads.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can upload files to their projects" ON file_uploads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete files in their projects" ON file_uploads
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = file_uploads.project_id AND projects.user_id = auth.uid())
  );

-- ===== HABITS POLICIES =====

CREATE POLICY "Users can view their own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- ===== HABIT_LOGS POLICIES =====

CREATE POLICY "Users can view logs for their habits" ON habit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
  );

CREATE POLICY "Users can insert logs for their habits" ON habit_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_id AND user_id = auth.uid())
  );
```

3. Go to **Storage** (left sidebar)
4. Click **Create Bucket**
   - Name: `project-files`
   - Make it **Public**
   - Click **Create Bucket**

### Step 3: Create GitHub Repository

1. Go to https://github.com and create a new repository
   - Name: `project-dashboard` (or whatever you want)
   - Make it **Public**
   - Add a README
   - Click **Create Repository**

2. Clone it to your computer:
```bash
git clone https://github.com/YOUR_USERNAME/project-dashboard.git
cd project-dashboard
```

### Step 4: Add Files to Repository

1. Download both files:
   - `index.html` (Project Dashboard)
   - `habits.html` (Habits Tracker)

2. Place them in your repository folder

3. Open both files in a text editor and find these lines:
```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_KEY = "your-public-key-here";
```

4. Replace with your actual credentials from Step 1:
   - `https://your-project.supabase.co` → Your Project URL
   - `your-public-key-here` → Your Public API Key

5. **Save both files**

### Step 5: Deploy to GitHub

1. In your repository folder, use Git to push your code:

```bash
git add index.html habits.html
git commit -m "Add dashboard and habits tracker"
git push origin main
```

2. Go to your GitHub repository → **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

**Your dashboard is now live!** 🎉

GitHub will show you the URL (something like `https://YOUR_USERNAME.github.io/project-dashboard/`)

### Step 6: First Time Setup

1. Visit your dashboard URL
   - `index.html` is your main dashboard (projects/tasks)
   - `habits.html` is accessible via the "🎯 Habits" link in the navbar

2. Click **Sign Up** to create your account
3. Confirm your email (Supabase sends a confirmation link)
4. Log in and start using:
   - **Projects Dashboard**: Create projects, add tasks, track progress, upload files
   - **Habits Tracker**: Add habits, increment/decrement counters, view detailed history

---

## What's New in This Version

### Projects & Tasks - Now Fully Editable
✅ **Edit Projects** - Click the "Edit" button on any project card to modify:
- Project name
- Description
- Start and end dates
- Status (active, pending, completed)

✅ **Edit Tasks** - Click the "Edit" button on any task to modify:
- Task title
- Description
- Priority level
- Due date
- Status

### Habits Tracker - Complete Counter System
✅ **Add Habits** - Simple form at the top, create as many as you want
✅ **Quick Counter** - Large + and - buttons for increment/decrement
✅ **Visual Feedback** - Green for increment, red for decrement, buttons scale on hover
✅ **Detailed History** - Click any habit name to see complete history with timestamps
✅ **Automatic Tracking** - Every + and - button press is logged with exact time

---

## File Descriptions

### index.html
**Project Management Dashboard**

Features:
- Create/edit/delete projects
- Create/edit/delete tasks with priority levels
- Track task and project status
- Upload files to projects (photos, documents, etc.)
- Full CRUD operations (all data is editable)
- Responsive design for desktop and mobile

### habits.html
**Habit Tracking Application**

Features:
- Add/delete habits with simple names
- Counter buttons for quick increments/decrements
- View detailed history when you click on a habit
- Shows every change with exact timestamp
- Track total count per habit
- Organized by creation date

---

## Troubleshooting

**"CORS error" or "Failed to fetch"**
- Check your Supabase URL and API key are correct
- Make sure credentials are entered in BOTH files (index.html and habits.html)
- No extra spaces or typos

**Can't sign up**
- Check email confirmations are enabled in Supabase
- Go to Supabase → Authentication → Email Settings

**File uploads not working**
- Verify bucket is named `project-files`
- Check that the bucket is set to **Public**

**Habits not saving**
- Verify habits and habit_logs tables were created
- Check that all SQL ran without errors

**Can't see my data**
- Make sure you're signed in
- Data is private - you only see your own projects and habits
- Other users won't see your data (Row Level Security)

**Edit buttons not appearing**
- Refresh the page
- Check browser console for errors (F12)

---

## Adding a Custom Domain (Optional)

If you bought a domain (like `mydashboard.com`):

1. In GitHub → **Settings** → **Pages**
2. Under "Custom domain", enter your domain
3. Update your domain registrar's DNS settings
4. Add the CNAME record GitHub shows you
5. GitHub will verify and enable HTTPS

---

## Next Steps

1. ✅ **Complete setup above**
2. ✅ **Sign up and create your first project**
3. ✅ **Edit a project - try changing the status**
4. ✅ **Create tasks and edit them**
5. ✅ **Check out Habits by clicking the 🎯 link**
6. ✅ **Add a habit and use the counter**
7. ✅ **Click on a habit to see your history**
8. **Optional:** Add custom domain for professional URL

---

## Technical Details

**Technology Stack:**
- Frontend: React 18 (static HTML file, no build needed)
- Backend: Supabase (PostgreSQL + authentication)
- Hosting: GitHub Pages (free, automatic HTTPS)
- Database: Supabase free tier (500MB)
- File Storage: Supabase Storage (5GB free)

**Security:**
- Row Level Security (RLS) policies enforce data privacy
- Only you can access your projects and habits
- Even if someone hacks the JavaScript, the database prevents unauthorized access
- Passwords encrypted with bcrypt
- HTTPS on all connections

**Cost:**
- $0/month for GitHub Pages hosting
- $0/month for Supabase database (free tier)
- Optional: $10-20/year for custom domain

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **GitHub Pages Docs:** https://pages.github.com

Happy tracking! 🚀
