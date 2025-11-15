// Test database connection for Settings page
// Run this with: node test-database-connection.js

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseConnection() {
    console.log('🔍 Testing Database Connection...\n');

    try {
        // Test 1: Check if users table exists
        console.log('1️⃣ Testing users table...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (usersError) {
            console.log('❌ Users table error:', usersError.message);
        } else {
            console.log('✅ Users table connected');
        }

        // Test 2: Check if roles table exists and has data
        console.log('\n2️⃣ Testing roles table...');
        const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('*');

        if (rolesError) {
            console.log('❌ Roles table error:', rolesError.message);
        } else {
            console.log('✅ Roles table connected');
            console.log('   Roles found:', roles.length);
            roles.forEach(role => {
                console.log(`   - ${role.name}: ${role.description}`);
            });
        }

        // Test 3: Check if user_roles table exists
        console.log('\n3️⃣ Testing user_roles table...');
        const { data: userRoles, error: userRolesError } = await supabase
            .from('user_roles')
            .select('*')
            .limit(1);

        if (userRolesError) {
            console.log('❌ User_roles table error:', userRolesError.message);
        } else {
            console.log('✅ User_roles table connected');
        }

        // Test 4: Check if permissions table exists
        console.log('\n4️⃣ Testing permissions table...');
        const { data: permissions, error: permissionsError } = await supabase
            .from('permissions')
            .select('*');

        if (permissionsError) {
            console.log('❌ Permissions table error:', permissionsError.message);
        } else {
            console.log('✅ Permissions table connected');
            console.log('   Permissions found:', permissions.length);
        }

        // Test 5: Check if refresh_tokens table exists
        console.log('\n5️⃣ Testing refresh_tokens table...');
        const { data: tokens, error: tokensError } = await supabase
            .from('refresh_tokens')
            .select('*')
            .limit(1);

        if (tokensError) {
            console.log('❌ Refresh_tokens table error:', tokensError.message);
        } else {
            console.log('✅ Refresh_tokens table connected');
        }

        console.log('\n✨ Database Connection Test Complete!\n');

        // Summary
        const tables = {
            users: !usersError,
            roles: !rolesError,
            user_roles: !userRolesError,
            permissions: !permissionsError,
            refresh_tokens: !tokensError
        };

        const connectedCount = Object.values(tables).filter(v => v).length;
        const totalTables = Object.keys(tables).length;

        console.log(`📊 Summary: ${connectedCount}/${totalTables} tables connected\n`);

        if (connectedCount === totalTables) {
            console.log('🎉 All tables are connected! Settings page is ready to use.\n');
        } else {
            console.log('⚠️  Some tables are missing. Run database-setup.sql in Supabase.\n');
            console.log('Missing tables:');
            Object.entries(tables).forEach(([table, connected]) => {
                if (!connected) console.log(`   - ${table}`);
            });
        }

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
    }
}

testDatabaseConnection();
