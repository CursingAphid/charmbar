# Database Setup Guide

This guide will help you set up Vercel Postgres for your Charm Bazaar app.

## Step 1: Create Vercel Postgres Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Charm Bazaar project
3. Go to the **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose your database name (e.g., `charmbazaar-db`)
6. Select your region (choose the closest to your users)
7. Click **Create**

## Step 2: Run Database Schema

After creating the database, you need to run the schema to create tables and insert sample data:

1. In your Vercel dashboard, go to your database
2. Click the **Query** tab
3. Copy and paste the contents of `schema.sql` from your project
4. Click **Run** to execute the schema

This will create:
- `bracelets` table with 2 sample bracelets
- `charms` table with 7 sample charms
- Proper indexes for performance

## Step 3: Environment Variables

Vercel automatically creates the `POSTGRES_URL` environment variable for your database. You can verify this in:

1. Go to your project settings
2. Click **Environment Variables**
3. You should see `POSTGRES_URL` automatically added

If you need to add it manually:
- Copy the connection string from your database dashboard
- Add it as `POSTGRES_URL` in your environment variables

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

## Troubleshooting

### Build Errors
If you see "missing_connection_string" errors during build, that's normal - the database connection is only available at runtime.

### Database Connection Issues
- Verify `POSTGRES_URL` environment variable is set in Vercel
- Check that your database is in the same region as your Vercel project
- Ensure the database isn't paused (check Vercel dashboard)

### Data Not Loading
- Run the schema.sql in your database query editor
- Check Vercel function logs for database errors
- Verify environment variables are deployed

## Next Steps

Once your database is connected, you can:
- Add admin functionality to manage products
- Implement user accounts and wishlists
- Add order tracking and history
- Create product reviews and ratings
- Implement inventory management

The database is now ready to scale with your app! 🚀
