# Setting Up GitHub Repository

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name it: `authenticvoice-platform`
4. Description: "AI-powered screenwriting platform for developing authentic creative voice"
5. Choose "Private" or "Public" based on your preference
6. **Don't** initialize with README (we already have one)
7. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/authenticvoice-platform.git

# Push your code
git push -u origin main
```

## Step 3: Share for Testing

### For Private Repositories:
1. Go to Settings → Manage access
2. Click "Add people"
3. Enter collaborators' GitHub usernames

### For Public Repositories:
Just share the URL: `https://github.com/YOUR_USERNAME/authenticvoice-platform`

## Step 4: Help Testers Set Up

Share these instructions with testers:

1. **Clone the repository:**
```bash
git clone https://github.com/USERNAME/authenticvoice-platform.git
cd authenticvoice-platform
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up Supabase:**
- Create a free account at [supabase.com](https://supabase.com)
- Create a new project
- Go to Settings → API
- Copy the Project URL and anon key

4. **Set up OpenRouter:**
- Create account at [openrouter.ai](https://openrouter.ai)
- Get API key from dashboard

5. **Configure environment:**
```bash
cp .env.example .env.local
# Edit .env.local with their credentials
```

6. **Run the app:**
```bash
npm run dev
```

## Important Notes for Testers

- The app requires both Supabase and OpenRouter accounts
- Free tiers are available for both services
- The assessment saves data to Supabase, so each tester needs their own project
- Report issues via GitHub Issues

## Database Setup

Testers will need to run the migration in their Supabase project:
1. Go to SQL Editor in Supabase
2. Run the migration from `supabase/migrations/create_conversations_table.sql`