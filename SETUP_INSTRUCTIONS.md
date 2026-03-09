# Project Dashboard - Setup & Deployment Guide

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
2. Copy and paste this SQL, then click **Run**:

```sql
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

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view tasks in their projects" ON tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage tasks in their projects" ON tasks
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

CREATE POLICY "Users can view files in their projects" ON file_uploads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = file_uploads.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can upload files to their projects" ON file_uploads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND user_id = auth.uid())
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

### Step 4: Get the Dashboard Code

I'll provide you with the complete dashboard code. Save it as `index.html` in your repository folder.

### Step 5: Configure Your API Keys

**Important:** Open `index.html` in a text editor and find these lines (near the top):

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_KEY";
```

Replace with your actual keys from Step 1:
- `YOUR_SUPABASE_URL` → Your Project URL
- `YOUR_SUPABASE_KEY` → Your Public API Key

**Save the file.**

### Step 6: Deploy to GitHub Pages

1. In your repository folder, use Git to push your code:

```bash
git add index.html
git commit -m "Initial dashboard commit"
git push origin main
```

2. Go to your GitHub repository → **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

**Your dashboard is now live!** 🎉

GitHub will show you the URL (something like `https://YOUR_USERNAME.github.io/project-dashboard/`)

### Step 7: First Time Setup

1. Visit your dashboard URL
2. Click **Sign Up** to create your account
3. Confirm your email (Supabase sends a confirmation link)
4. Log in and start creating projects!

---

## Adding a Custom Domain (Optional)

If you bought a domain (like `mydashboard.com`):

1. In GitHub → **Settings** → **Pages**
2. Under "Custom domain", enter your domain
3. Update your domain's DNS settings to point to GitHub Pages
   - Your domain registrar (Namecheap, etc.) will have DNS settings
   - Add the CNAME record they show you
4. GitHub will verify and enable HTTPS

---

## Troubleshooting

**"CORS error" or "Failed to fetch"**
- Check your Supabase URL and API key are correct
- Make sure you copied them exactly (no extra spaces)

**Can't sign up**
- Check that email confirmations are enabled in Supabase
- Go to Supabase → Authentication → Email Settings

**File uploads not working**
- Verify your bucket is named `project-files`
- Check that the bucket is set to **Public**

**Can't see my projects**
- Make sure you're signed in
- Check database is properly configured (run the SQL from Step 2 again if needed)

---

## Next Steps

Once deployed, you can:
- Customize the styling by editing the CSS
- Add more features (notes, attachments, team collaboration)
- Connect it to your HVAC business processes
- Share access with team members (they'll create their own accounts)

Need help? The dashboard includes helpful error messages if something goes wrong!
