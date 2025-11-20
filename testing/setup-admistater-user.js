// Setup Admistater test user in database
// Run: node testing/setup-admistater-user.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration - hardcoded for testing
const SUPABASE_URL = 'https://bjlpvbiyjpcjgvpdzvcy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbHB2Yml5anBjamd2cGR6dmN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE5NDMxMSwiZXhwIjoyMDc4NzcwMzExfQ.-J_Fgji66NXzVduMR-42fml_zbUeQYWjI8u55cEh4I8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdmistaterUser() {
    console.log('\n========================================');
    console.log('🔧 Setting Up Admistater Test User');
    console.log('========================================\n');

    const email = 'admistater@lnc.com';
    const password = 'admistater@lnc.com';

    try {
        // Check if user already exists
        console.log('1️⃣  Checking if user exists...');
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', email)
            .single();

        let userId;

        if (existingUser) {
            console.log(`✅ User already exists: ${existingUser.email}`);
            userId = existingUser.id;
        } else {
            // Create user
            console.log('2️⃣  Creating user...');
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    email,
                    password, // Note: In production, this should be hashed
                    name: 'Admistater Test User',
                    status: 'approved'
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ Error creating user:', createError.message);
                return;
            }

            console.log(`✅ User created: ${newUser.email}`);
            userId = newUser.id;
        }

        // Check if role assignment exists
        console.log('3️⃣  Getting Admistater role ID...');
        const { data: admistaterRole, error: roleError } = await supabase
            .from('roles')
            .select('id, name')
            .eq('name', 'admistater')
            .single();

        if (roleError || !admistaterRole) {
            console.error('❌ Admistater role not found in database');
            console.log('   Please run the role setup SQL script first');
            return;
        }

        console.log(`✅ Found role: ${admistaterRole.name} (${admistaterRole.id})`);

        console.log('4️⃣  Checking role assignments...');
        const { data: existingRoles } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', userId);

        const hasAdmistaterRole = existingRoles?.some(r => r.role_id === admistaterRole.id);

        if (!hasAdmistaterRole) {
            console.log('5️⃣  Assigning Admistater role...');
            const { error: assignError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: userId,
                    role_id: admistaterRole.id
                });

            if (assignError) {
                console.error('❌ Error assigning role:', assignError.message);
                return;
            }

            console.log('✅ Admistater role assigned');
        } else {
            console.log('✅ User already has Admistater role');
        }

        // Verify final setup
        console.log('\n6️⃣  Verifying setup...');
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role_id, roles(name)')
            .eq('user_id', userId);

        console.log('\n========================================');
        console.log('✅ Setup Complete!');
        console.log('========================================');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Roles: ${userRoles?.map(r => r.roles?.name).filter(Boolean).join(', ') || 'None'}`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    }
}

setupAdmistaterUser();
