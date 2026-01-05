# Database Setup Guide

**✅ Your Supabase database is already set up and ready to use!**

The app now connects directly to your Supabase database at `https://axuyosjuhsmzefovydby.supabase.co` using the provided credentials.

## Environment Variables

Your app is configured to use these Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://axuyosjuhsmzefovydby.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dXlvc2p1aHNtemVmb3Z5ZGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NDA2MzksImV4cCI6MjA4MzIxNjYzOX0.yxL9-pHhRP83Y3cuQ1tnxd2w6PIBEBk0VVrhFB9X-CY"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dXlvc2p1aHNtemVmb3Z5ZGJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY0MDYzOSwiZXhwIjoyMDgzMjE2NjM5fQ.z8VWTZD2VUHSUlOGV2Om5YMg4PQU_FHXfPJCgTvupls"
```

**For Vercel deployment**, add these to your project settings under Environment Variables.

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
