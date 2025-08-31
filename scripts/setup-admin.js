#!/usr/bin/env node

/**
 * Setup script for creating initial admin user for Bluefin Analytics Dashboard
 * Usage: node scripts/setup-admin.js <username> <password> <full_name> <email>
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupAdmin() {
  const [username, password, fullName, email] = process.argv.slice(2);

  if (!username || !password || !fullName || !email) {
    console.error('❌ Usage: node scripts/setup-admin.js <username> <password> <full_name> <email>');
    console.error('   Example: node scripts/setup-admin.js bluefin_admin mypassword123 "Bluefin Administrator" admin@bluefinwc.com');
    process.exit(1);
  }

  try {
    console.log('🔧 Setting up admin user...');

    // Get Bluefin restaurant ID
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name')
      .ilike('name', '%bluefin%')
      .limit(1)
      .single();

    if (restaurantError || !restaurant) {
      console.error('❌ Error: Could not find Bluefin restaurant in database');
      console.error('   Make sure the restaurant exists first');
      process.exit(1);
    }

    console.log(`✅ Found restaurant: ${restaurant.name} (${restaurant.id})`);

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');

    // Create admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        username: username,
        password_hash: passwordHash,
        full_name: fullName,
        email: email,
        restaurant_id: restaurant.id,
        role: 'admin',
        is_active: true
      }, {
        onConflict: 'username'
      })
      .select('id, username, full_name, email, role')
      .single();

    if (adminError) {
      console.error('❌ Error creating admin user:', adminError.message);
      process.exit(1);
    }

    console.log('🎉 Admin user created successfully!');
    console.log('');
    console.log('📋 Admin User Details:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Full Name: ${adminUser.full_name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Restaurant: ${restaurant.name}`);
    console.log('');
    console.log('🌐 Access the dashboard at:');
    console.log('   Development: http://localhost:8081/admin');
    console.log('   Production: https://admin.bluefinwc.com');
    console.log('');
    console.log('🔐 Login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('⚠️  Important: Change the password after first login!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAdmin();