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

-- Insert sample bracelet data
INSERT INTO bracelets (id, name, description, price, image, openImage, grayscale, color, material) VALUES
('bracelet-1', 'Classic Silver Chain', 'Elegant silver chain bracelet perfect for any occasion', 29.99, '/images/bracelets/bracelet_silver.png', '/images/bracelets/bracelet_open.png', true, 'Silver', 'Sterling Silver'),
('bracelet-2', 'Gold Plated Chain', 'Luxurious gold-plated chain with timeless appeal', 34.99, '/images/bracelets/bracelet_gold.png', '/images/bracelets/bracelet_open.png', false, 'Gold', 'Gold Plated');

-- Insert sample charm data
INSERT INTO charms (id, name, description, price, image, category, icon3d, glbPath, background) VALUES
('charm-1', 'Heart with Wings', 'Classic heart with wings charm', 3.99, '/images/charms/heart_with_wings.png', 'Symbols', NULL, '/images/charms/heart_with_wings.glb', '/images/charms/backgrounds/heart_with_wings_background.png'),
('charm-2', 'Snowflake', 'Delicate snowflake charm', 3.99, '/images/charms/snowflake.png', 'Nature', 'Snowflake', NULL, NULL),
('charm-3', 'Mother & Daughter Heart', 'Beautiful mother and daughter heart charm', 3.99, '/images/charms/mother_daughter_heart.png', 'Symbols', 'Heart', NULL, NULL),
('charm-4', 'Tree in Heart', 'Tree of life in heart charm', 3.99, '/images/charms/tree_in_heart.png', 'Nature', 'Tree', NULL, NULL),
('charm-5', 'Golden Ripple', 'Elegant golden ripple charm with flowing waves', 3.99, '/images/charms/golden_ripple_charm.png', 'Nature', NULL, '/images/charms/golden_ripple_charm.glb', '/images/charms/backgrounds/golden_ripple_ring_background.png'),
('charm-6', 'Tree in Circle', 'Beautiful tree encircled by elegant design', 3.99, '/images/charms/tree_in_circle.png', 'Nature', NULL, '/images/charms/tree_in_circle.glb', '/images/charms/backgrounds/tree_in_circle_background.png'),
('charm-7', 'Half Moon', 'Mystical half moon charm with celestial beauty', 3.99, '/images/charms/half_moon.png', 'Nature', NULL, '/images/charms/half_moon.glb', '/images/charms/backgrounds/half_moon_background.png');
