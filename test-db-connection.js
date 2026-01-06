import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

    // Test 1: Check if tables exist
    console.log('📋 Checking table structure...');

    // Test 2: Get charms count
    const { count: charmsCount, error: countError } = await supabase
      .from('charms')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Charms table error:', countError.message);
      console.log('💡 This likely means the schema.sql hasn\'t been run in Supabase');
      console.log('   Go to https://supabase.com/dashboard/project/axuyosjuhsmzefovydby/sql');
      console.log('   And run the contents of schema.sql');
      return;
    }

    console.log(`✅ Charms table exists with ${charmsCount} records`);

    // Test 3: Get one charm to verify data structure
    const { data: sampleCharm, error: sampleError } = await supabase
      .from('charms')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('❌ Error fetching sample charm:', sampleError.message);
    } else {
      console.log('✅ Sample charm:', {
        id: sampleCharm.id,
        name: sampleCharm.name,
        hasImageData: !!sampleCharm.image_data,
        hasGlbData: !!sampleCharm.glb_data,
        hasBackgroundData: !!sampleCharm.background_data
      });
    }

    console.log('\n🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();

