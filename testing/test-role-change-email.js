// Test role change for rohit@lnc.com: Super Admin -> Admistater
// This will update the role and send email notification

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        if (line.trim().startsWith('#') || !line.trim()) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            const commentIndex = value.indexOf('//');
            if (commentIndex !== -1) {
                value = value.substring(0, commentIndex).trim();
            }
            value = value.replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

const http = require('http');
const API_BASE = 'http://localhost:3000';
const TEST_USER_EMAIL = 'rohit@lnc.com';
const NEW_ROLE = 'Admistater';

console.log('\n========================================');
console.log('🧪 Testing Role Change with Email');
console.log('========================================\n');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 3000,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: () => Promise.resolve(JSON.parse(data)),
                        text: () => Promise.resolve(data)
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        ok: false,
                        status: res.statusCode,
                        json: () => Promise.reject(e),
                        text: () => Promise.resolve(data)
                    });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function step1_fetchUser() {
    console.log('📋 Step 1: Fetching user...');
    try {
        const res = await makeRequest(`${API_BASE}/api/users/list`);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        const user = data.users.find(u => u.email === TEST_USER_EMAIL);

        if (!user) {
            console.log(`❌ User ${TEST_USER_EMAIL} not found`);
            console.log('Available users:', data.users.map(u => u.email).join(', '));
            return null;
        }

        console.log(`✅ Found user: ${user.email}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Display Name: ${user.display_name || 'Not set'}`);
        console.log(`   - Personal Email: ${user.personal_email || 'Not set'}`);
        console.log(`   - Current Roles: ${user.roles?.join(', ') || 'None'}`);

        return user;
    } catch (error) {
        console.error('❌ Failed to fetch users:', error.message);
        return null;
    }
}

async function step2_updateRole(userId) {
    console.log(`\n🔄 Step 2: Changing role to "${NEW_ROLE}"...`);
    try {
        const res = await makeRequest(`${API_BASE}/api/users/update-roles`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                roles: [NEW_ROLE],
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Update failed');
        }

        const data = await res.json();
        console.log(`✅ Role updated successfully!`);
        console.log(`   Message: ${data.message}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to update role:', error.message);
        return false;
    }
}

async function step3_verifyUpdate() {
    console.log('\n🔍 Step 3: Verifying role change...');
    try {
        const res = await makeRequest(`${API_BASE}/api/users/list`);
        const data = await res.json();
        const user = data.users.find(u => u.email === TEST_USER_EMAIL);

        if (!user) {
            console.log('❌ User not found after update');
            return null;
        }

        console.log(`✅ Current roles: ${user.roles?.join(', ') || 'None'}`);

        if (user.roles?.includes(NEW_ROLE)) {
            console.log(`✅ Role "${NEW_ROLE}" confirmed!`);
            return user;
        } else {
            console.log(`❌ Role "${NEW_ROLE}" not found in user roles`);
            return null;
        }
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        return null;
    }
}

async function runTest() {
    try {
        // Step 1: Fetch user
        const user = await step1_fetchUser();
        if (!user) {
            console.log('\n❌ Test failed: Could not find user');
            return;
        }

        // Check if user already has the role
        if (user.roles?.includes(NEW_ROLE)) {
            console.log(`\n⚠️  User already has role "${NEW_ROLE}"`);
            console.log('   Continuing with role update anyway to trigger email...');
        }

        // Step 2: Update role
        const updated = await step2_updateRole(user.id);
        if (!updated) {
            console.log('\n❌ Test failed: Could not update role');
            return;
        }

        // Wait for email to be sent
        console.log('\n⏳ Waiting 3 seconds for email to be sent...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3: Verify update
        const verifiedUser = await step3_verifyUpdate();
        if (!verifiedUser) {
            console.log('\n❌ Test failed: Could not verify update');
            return;
        }

        // Success!
        console.log('\n========================================');
        console.log('✅ ROLE CHANGE TEST PASSED!');
        console.log('========================================');
        console.log('\n📋 Summary:');
        console.log(`   User: ${TEST_USER_EMAIL}`);
        console.log(`   New Role: ${NEW_ROLE}`);
        console.log(`   All Roles: ${verifiedUser.roles?.join(', ') || 'None'}`);
        console.log(`   Display Name: ${verifiedUser.display_name || 'Not set'}`);
        console.log(`   Personal Email: ${verifiedUser.personal_email || 'Not set'}`);

        const emailTarget = verifiedUser.personal_email || verifiedUser.email;
        console.log(`\n📧 Email Notification Details:`);
        console.log(`   Sent to: ${emailTarget}`);
        console.log(`   Subject: 🔄 Your LNC Admin Roles Have Been Updated`);
        console.log(`   Content: Role change notification with current roles`);

        console.log(`\n📬 Check inbox: ${emailTarget}`);
        console.log('   Look for role change notification email!');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
    }
}

// Run the test
runTest();
