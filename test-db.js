// Simple test script to verify Supabase connection
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not found!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...');

    // Test 1: Get bracelets
    console.log('📦 Fetching bracelets...');
    const { data: bracelets, error: braceletsError } = await supabase
      .from('bracelets')
      .select('*')
      .limit(5);

    if (braceletsError) {
      console.error('❌ Bracelets error:', braceletsError.message);
    } else {
      console.log(`✅ Found ${bracelets.length} bracelets:`, bracelets.map(b => b.name));
    }

    // Test 2: Get charms
    console.log('\n✨ Fetching charms...');
    const { data: charms, error: charmsError } = await supabase
      .from('charms')
      .select('*')
      .limit(5);

    if (charmsError) {
      console.error('❌ Charms error:', charmsError.message);
    } else {
      console.log(`✅ Found ${charms.length} charms:`, charms.map(c => c.name));
    }

    // Test 3: Get featured charms (with backgrounds)
    console.log('\n🌟 Fetching featured charms...');
    const { data: featuredCharms, error: featuredError } = await supabase
      .from('charms')
      .select('*')
      .not('background', 'is', null)
      .limit(3);

    if (featuredError) {
      console.error('❌ Featured charms error:', featuredError.message);
    } else {
      console.log(`✅ Found ${featuredCharms.length} featured charms:`, featuredCharms.map(c => c.name));
    }

    console.log('\n🎉 Supabase connection test completed!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();
