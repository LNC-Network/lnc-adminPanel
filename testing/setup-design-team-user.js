/**
 * Setup Second Test User for User-Specific Content Testing
 */

import { createClient } from '@supabase/supabase-js';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing environment variables. Check .env file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TEST_USER = {
    email: 'design.team@lnc.com',
    password: 'Design@Team123',
    displayName: 'Design Team Member',
    phone: '+1234567892'
};

async function setupUser() {
    try {
        console.log('\n🚀 Setting up Design Team test user...\n');

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', TEST_USER.email)
            .single();

        if (existingUser) {
            console.log('✅ User already exists:', TEST_USER.email);
            console.log('   Display Name:', existingUser.display_name);
            console.log('   User ID:', existingUser.id);
            console.log('\n📋 Login Credentials:');
            console.log('   Email:', TEST_USER.email);
            console.log('   Password:', TEST_USER.password);
            return;
        }

        // Hash password
        const passwordHash = await argon2.hash(TEST_USER.password);

        // Create new user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                email: TEST_USER.email,
                password_hash: passwordHash,
                display_name: TEST_USER.displayName,
                is_active: true
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        // Get design team role
        const { data: roles } = await supabase
            .from('roles')
            .select('id, name')
            .in('name', ['design team']);

        if (roles && roles.length > 0) {
            // Assign role to user
            for (const role of roles) {
                await supabase
                    .from('user_roles')
                    .insert({
                        user_id: newUser.id,
                        role_id: role.id
                    });
                console.log(`✓ Assigned role: ${role.name}`);
            }
        }

        console.log('\n✅ User created successfully!');
        console.log('   Email:', newUser.email);
        console.log('   Display Name:', newUser.display_name);
        console.log('   User ID:', newUser.id);
        console.log('\n📋 Login Credentials:');
        console.log('   Email:', TEST_USER.email);
        console.log('   Password:', TEST_USER.password);
        console.log('\n✨ You can now run: node testing/test-user-specific-content.js\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupUser();
