# Database Setup Guide

This guide will help you set up **Supabase** (PostgreSQL) for your Charm Bazaar app.

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Choose your organization
4. Fill in project details:
   - **Name**: `Charm Bazaar` (or your choice)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
5. Click **"Create new project"**

Wait 2-3 minutes for the project to be fully provisioned.

## Step 2: Run Database Schema

After creating the project, you need to run the schema to create tables and insert sample data:

1. In your Supabase dashboard, go to your project
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy and paste the contents of `schema.sql` from your project
5. Click **"Run"** to execute the schema

This will create:
- `bracelets` table with 2 sample bracelets
- `charms` table with 7 sample charms
- Row Level Security (RLS) policies for security

## Step 3: Environment Variables

You need to add these environment variables to your Vercel project:

1. Go to your Vercel project dashboard
2. Go to **Project Settings** → **Environment Variables**
3. Add these variables:

**Required for Admin Dashboard Integration:**
- `NEXT_PUBLIC_API_URL` = URL where your admin dashboard is deployed (e.g., `https://your-admin-dashboard.vercel.app`)

**For Supabase (if still using for other features):**
- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/public key

**Important**: Make sure to set these for **all environments** (Production, Preview, Development)

### Example .env.local file:
```env
# Point to your admin dashboard deployment
NEXT_PUBLIC_API_URL=https://your-admin-dashboard.vercel.app

# Supabase credentials (if needed)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Deploy

Once everything is set up:

1. Commit your changes: `git add . && git commit -m "Add database integration"`
2. Push to main: `git push origin main`
3. Vercel will automatically redeploy with database connectivity

## Database Schema Overview

### Bracelets Table
```sql
- id: Unique identifier
- name: Display name
- description: Product description
- price: Price in USD
- image: Main image path
- openImage: Open bracelet image path
- grayscale: Whether to show in grayscale
- color: Color name
- material: Material description
```

### Charms Table
```sql
- id: Unique identifier
- name: Display name
- description: Product description
- price: Price in USD
- image: Main image path
- category: Product category (Symbols, Nature, etc.)
- icon3d: 3D icon name (for react-3d-icons)
- glbPath: Path to 3D GLB model file
- background: Background image path (for featured display)
```

## Available Database Functions

Your app now uses these database functions instead of static data:

- `getBracelets()` - Fetch all bracelets
- `getCharms()` - Fetch all charms
- `getCharmsByCategory(category)` - Filter charms by category
- `getCharmCategories()` - Get unique category list
- `getCharmsWithBackgrounds()` - Get charms that have background images
- `getBraceletById(id)` / `getCharmById(id)` - Fetch individual items

## Supabase Features You Get

- **Real-time subscriptions** - Live updates when data changes
- **Built-in authentication** - User accounts ready to add
- **File storage** - Upload product images
- **Edge functions** - Serverless API endpoints
- **Dashboard** - Visual database management
- **API documentation** - Auto-generated docs

## Troubleshooting

### Environment Variable Issues
- Make sure variables are named exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check that they're set for all environments (Production, Preview, Development)
- The `NEXT_PUBLIC_` prefix makes them available in the browser

### Database Connection Issues
- Verify your Supabase project is active (not paused)
- Check that the anon key has the right permissions
- Ensure you're using the correct project URL from Supabase dashboard

### Data Not Loading
- Run the `schema.sql` in Supabase SQL Editor
- Check browser console for JavaScript errors
- Verify environment variables are correctly set in Vercel

### Supabase Dashboard
- Use the **Table Editor** to view/edit data manually
- Check **Logs** for any database errors
- Use **API Docs** to test endpoints

### API URL Configuration
- **"NEXT_PUBLIC_API_URL is not configured"** - Make sure you've set the environment variable pointing to your admin dashboard URL
- **404 errors** - Verify the admin dashboard is deployed and the URL is correct
- **CORS errors** - The admin dashboard may need to allow requests from your main app's domain

## Next Steps

Once your database is connected, you can:
- Add admin functionality to manage products
- Implement user accounts and wishlists
- Add order tracking and history
- Create product reviews and ratings
- Implement inventory management

The database is now ready to scale with your app! 🚀
