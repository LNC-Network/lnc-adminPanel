/**
 * Setup Content Team Admin User for Cloudinary Testing
 */

import { createClient } from '@supabase/supabase-js';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER = {
    email: process.env.CONTENT_TEAM_ADMIN_TEST_EMAIL || 'content.admin@lnc.com',
    password: process.env.CONTENT_TEAM_ADMIN_TEST_PASSWORD || 'content.admin@lnc.com',
    displayName: 'Content Team Admin (Test)'
};

async function setupContentAdmin() {
    console.log('\n🔧 Setting up Content Team Admin test user...\n');

    try {
        // 1. Check if user exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, email, display_name')
            .eq('email', TEST_USER.email)
            .maybeSingle();

        if (fetchError) {
            console.error('❌ Error checking user:', fetchError);
            return;
        }

        let userId;

        if (existingUser) {
            console.log('✓ User already exists:', existingUser.email);
            userId = existingUser.id;
        } else {
            // 2. Create user with argon2 hashed password
            const passwordHash = await argon2.hash(TEST_USER.password);

            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    email: TEST_USER.email,
                    password_hash: passwordHash,
                    display_name: TEST_USER.displayName,
                    is_active: true
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ Error creating user:', createError);
                return;
            }

            console.log('✓ Created new user:', newUser.email);
            userId = newUser.id;
        }

        // 3. Get role IDs for content team admin
        const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('id, name')
            .in('name', ['content team admin', 'content team']);

        if (rolesError) {
            console.error('❌ Error fetching roles:', rolesError);
            return;
        }

        if (!roles || roles.length === 0) {
            console.error('❌ No content team roles found. Run role setup scripts first.');
            return;
        }

        console.log('✓ Found roles:', roles.map(r => r.name).join(', '));

        // 4. Assign roles to user
        for (const role of roles) {
            const { data: existingRole, error: checkRoleError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', userId)
                .eq('role_id', role.id)
                .maybeSingle();

            if (!existingRole) {
                const { error: assignError } = await supabase
                    .from('user_roles')
                    .insert({
                        user_id: userId,
                        role_id: role.id
                    });

                if (assignError) {
                    console.error(`❌ Error assigning role ${role.name}:`, assignError);
                } else {
                    console.log(`✓ Assigned role: ${role.name}`);
                }
            } else {
                console.log(`✓ Role already assigned: ${role.name}`);
            }
        }

        // 5. Verify setup
        console.log('\n📋 Verification:');
        const { data: userWithRoles } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', userId);

        const assignedRoles = userWithRoles?.map(ur => ur.roles?.name).filter(Boolean) || [];
        console.log(`   User: ${TEST_USER.email}`);
        console.log(`   Roles: ${assignedRoles.join(', ')}`);
        console.log(`   Can upload content: ${assignedRoles.some(r => r.includes('content'))}`);

        console.log('\n✅ Content Team Admin setup complete!\n');
        console.log('Test credentials:');
        console.log(`   Email: ${TEST_USER.email}`);
        console.log(`   Password: ${TEST_USER.password}`);
        console.log('\nYou can now run: node testing/test-cloudinary-integration.js\n');

    } catch (error) {
        console.error('❌ Setup error:', error);
    }
}

setupContentAdmin();
