# CRUD App Instructions for Charm Bazaar Database

## Objective
Create a simple web application (CRUD) to manage charms in the Charm Bazaar Supabase database. The app should allow creating, reading, updating, and deleting charm records.

## Database Information

### Supabase Connection
You will receive a `.env` file with the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Database Schema

#### Charms Table Structure
The `charms` table has the following columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | TEXT (Primary Key) | Yes | Unique identifier (e.g., 'charm-1', 'charm-8') |
| `name` | TEXT | Yes | Display name of the charm |
| `description` | TEXT | Yes | Product description |
| `price` | DECIMAL(10,2) | Yes | Price in USD (e.g., 3.99) |
| `image` | TEXT | Yes | Main image path (e.g., '/images/charms/charm_name.png') |
| `category` | TEXT | Yes | Product category (e.g., 'Symbols', 'Nature') |
| `icon3d` | TEXT | No | 3D icon name from react-3d-icons library (optional) |
| `glbPath` | TEXT | No | Path to 3D GLB model file (optional, e.g., '/images/charms/charm_name.glb') |
| `background` | TEXT | No | Background image path for featured display (optional, e.g., '/images/charms/backgrounds/charm_background.png') |
| `created_at` | TIMESTAMP | Auto | Automatically set on creation |
| `updated_at` | TIMESTAMP | Auto | Automatically updated |

**Important Notes:**
- The `id` field must be unique and follow the pattern: `'charm-'` followed by a number
- `category` should be one of: 'Symbols', 'Nature', or other categories as needed
- `icon3d` and `glbPath` are mutually exclusive - use one or the other, or neither
- `background` is optional but recommended for charms that should appear in featured sections
- All image paths should be relative paths starting with `/images/`

### Example Charm Record
```json
{
  "id": "charm-8",
  "name": "Star Charm",
  "description": "Beautiful star-shaped charm",
  "price": 3.99,
  "image": "/images/charms/star.png",
  "category": "Symbols",
  "icon3d": "Star",
  "glbPath": null,
  "background": "/images/charms/backgrounds/star_background.png"
}
```

## Required CRUD Operations

### 1. CREATE (Add New Charm)
- Form fields for all charm properties
- Validation for required fields (id, name, description, price, image, category)
- Generate unique ID if not provided (suggest next available number)
- Submit to Supabase `charms` table

### 2. READ (View All Charms)
- Display list/table of all charms from database
- Show key information: name, category, price
- Include search/filter functionality by category
- Click to view full details

### 3. UPDATE (Edit Existing Charm)
- Load existing charm data into form
- Allow editing all fields except `id` (primary key)
- Update record in Supabase
- Show success/error messages

### 4. DELETE (Remove Charm)
- Confirm before deletion
- Remove record from Supabase `charms` table
- Show success/error messages

## Technical Requirements

### Supabase Client Setup
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
```

### Required Supabase Operations

**Read all charms:**
```javascript
const { data, error } = await supabase
  .from('charms')
  .select('*')
  .order('created_at', { ascending: false })
```

**Create charm:**
```javascript
const { data, error } = await supabase
  .from('charms')
  .insert([{
    id: 'charm-8',
    name: 'Star Charm',
    description: 'Beautiful star-shaped charm',
    price: 3.99,
    image: '/images/charms/star.png',
    category: 'Symbols',
    icon3d: 'Star',
    glbPath: null,
    background: null
  }])
```

**Update charm:**
```javascript
const { data, error } = await supabase
  .from('charms')
  .update({ 
    name: 'Updated Name',
    price: 4.99 
  })
  .eq('id', 'charm-8')
```

**Delete charm:**
```javascript
const { data, error } = await supabase
  .from('charms')
  .delete()
  .eq('id', 'charm-8')
```

## App Features to Implement

1. **Main Dashboard/List View**
   - Table or card grid showing all charms
   - Search bar to filter by name
   - Category filter dropdown
   - "Add New Charm" button

2. **Create/Edit Form**
   - All required fields with labels
   - Input validation
   - Optional fields clearly marked
   - File upload or path input for images
   - Category dropdown with existing categories
   - Save/Cancel buttons

3. **Delete Confirmation**
   - Modal or alert before deletion
   - Show charm name being deleted
   - Confirm/Cancel buttons

4. **Error Handling**
   - Display Supabase errors to user
   - Validation errors for form fields
   - Success messages after operations

5. **UI/UX**
   - Clean, modern interface
   - Responsive design (works on mobile)
   - Loading states during API calls
   - Clear navigation between views

## Database Permissions

**Important:** The Supabase database has Row Level Security (RLS) enabled. You may need to:
- Use the service role key for write operations (INSERT, UPDATE, DELETE)
- Or update RLS policies to allow authenticated users to write

For a simple admin app, you can either:
1. Use `SUPABASE_SERVICE_ROLE_KEY` from the .env file for full access
2. Or create an RLS policy that allows writes (if using anon key)

## Deliverables

Create a complete web application with:
- ✅ List/View all charms
- ✅ Create new charms
- ✅ Edit existing charms
- ✅ Delete charms
- ✅ Search and filter functionality
- ✅ Form validation
- ✅ Error handling
- ✅ Modern, responsive UI

## Technology Stack Suggestions

You can use any framework you prefer:
- **Next.js** (recommended - matches main app)
- **React** with Vite
- **Vue.js**
- **Svelte**
- **Plain HTML/JavaScript**

Use the Supabase JavaScript client library: `@supabase/supabase-js`

## Getting Started

1. Receive the `.env` file with Supabase credentials
2. Install dependencies: `npm install @supabase/supabase-js`
3. Set up Supabase client with environment variables
4. Create the UI components for CRUD operations
5. Implement all four CRUD operations
6. Add validation and error handling
7. Test all operations with the database

## Additional Notes

- The `id` field format should be consistent: `'charm-'` + number
- When creating new charms, check existing IDs to avoid conflicts
- Image paths are relative URLs, not file uploads (assume images are already hosted)
- Categories are free-form text, but common ones are: 'Symbols', 'Nature'
- Price should be a decimal number (e.g., 3.99, not "3.99")

Good luck building the CRUD app! 🚀



