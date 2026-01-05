import { sql } from '@vercel/postgres';

// Database interfaces
export interface Bracelet {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  openImage?: string;
  grayscale?: boolean;
  color: string;
  material: string;
}

export interface Charm {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  icon3d?: string;
  glbPath?: string;
  background?: string;
}

// Database functions
export async function getBracelets(): Promise<Bracelet[]> {
  try {
    const { rows } = await sql<Bracelet>`
      SELECT * FROM bracelets ORDER BY created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching bracelets:', error);
    return [];
  }
}

export async function getCharms(): Promise<Charm[]> {
  try {
    const { rows } = await sql<Charm>`
      SELECT * FROM charms ORDER BY created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching charms:', error);
    return [];
  }
}

export async function getCharmsByCategory(category: string): Promise<Charm[]> {
  try {
    if (category === 'All') {
      return getCharms();
    }

    const { rows } = await sql<Charm>`
      SELECT * FROM charms WHERE category = ${category} ORDER BY created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching charms by category:', error);
    return [];
  }
}

export async function getCharmCategories(): Promise<string[]> {
  try {
    const { rows } = await sql<{ category: string }>`
      SELECT DISTINCT category FROM charms ORDER BY category
    `;
    return ['All', ...rows.map(row => row.category)];
  } catch (error) {
    console.error('Error fetching charm categories:', error);
    return ['All'];
  }
}

export async function getBraceletById(id: string): Promise<Bracelet | null> {
  try {
    const { rows } = await sql<Bracelet>`
      SELECT * FROM bracelets WHERE id = ${id} LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching bracelet by ID:', error);
    return null;
  }
}

export async function getCharmById(id: string): Promise<Charm | null> {
  try {
    const { rows } = await sql<Charm>`
      SELECT * FROM charms WHERE id = ${id} LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching charm by ID:', error);
    return null;
  }
}

export async function getCharmsWithBackgrounds(): Promise<Charm[]> {
  try {
    const { rows } = await sql<Charm>`
      SELECT * FROM charms WHERE background IS NOT NULL ORDER BY created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching charms with backgrounds:', error);
    return [];
  }
}
