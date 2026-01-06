-- Create bracelets table
CREATE TABLE IF NOT EXISTS bracelets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  openImage TEXT,
  grayscale BOOLEAN DEFAULT FALSE,
  color TEXT NOT NULL,
  material TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create charms table
CREATE TABLE IF NOT EXISTS charms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  icon3d TEXT,
  glbPath TEXT,
  background TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_charms_category ON charms(category);
CREATE INDEX IF NOT EXISTS idx_charms_background ON charms(background);

-- Enable Row Level Security (RLS)
ALTER TABLE bracelets ENABLE ROW LEVEL SECURITY;
ALTER TABLE charms ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) read access for the storefront.
-- Without these SELECT policies, the Supabase JS client will return 0 rows (no error) when using the anon key.
DROP POLICY IF EXISTS "Public read bracelets" ON bracelets;
CREATE POLICY "Public read bracelets"
  ON bracelets
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read charms" ON charms;
CREATE POLICY "Public read charms"
  ON charms
  FOR SELECT
  USING (true);

-- Create policies for public read access
CREATE POLICY "Allow public read access on bracelets" ON bracelets FOR SELECT USING (true);
CREATE POLICY "Allow public read access on charms" ON charms FOR SELECT USING (true);

-- Insert sample bracelet data
INSERT INTO bracelets (id, name, description, price, image, openImage, grayscale, color, material) VALUES
('bracelet-1', 'Classic Silver Chain', 'Elegant silver chain bracelet perfect for any occasion', 29.99, '/images/bracelets/bracelet_silver.png', '/images/bracelets/bracelet_open.png', true, 'Silver', 'Sterling Silver'),
('bracelet-2', 'Gold Plated Chain', 'Luxurious gold-plated chain with timeless appeal', 34.99, '/images/bracelets/bracelet_gold.png', '/images/bracelets/bracelet_open.png', false, 'Gold', 'Gold Plated');

-- Insert sample charm data (without binary data for now)
INSERT INTO charms (id, name, description, price, category) VALUES
('charm-1', 'Heart with Wings', 'Classic heart with wings charm', 3.99, 'Symbols'),
('charm-2', 'Snowflake', 'Delicate snowflake charm', 3.99, 'Nature'),
('charm-3', 'Mother & Daughter Heart', 'Beautiful mother and daughter heart charm', 3.99, 'Symbols'),
('charm-4', 'Tree in Heart', 'Tree of life in heart charm', 3.99, 'Nature'),
('charm-5', 'Golden Ripple', 'Elegant golden ripple charm with flowing waves', 3.99, 'Nature'),
('charm-6', 'Tree in Circle', 'Beautiful tree encircled by elegant design', 3.99, 'Nature'),
('charm-7', 'Half Moon', 'Mystical half moon charm with celestial beauty', 3.99, 'Nature');
