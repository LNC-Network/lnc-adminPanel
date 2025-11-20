// Test Admistater Role Functionality
// This test verifies that Admistater can perform all administrative tasks
// Run: node testing/test-admistater-role.js

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;

        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
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

const BASE_URL = 'http://localhost:3000'; // Force localhost for testing
const ADMISTATER_EMAIL = process.env.ADMISTATER_TEST_EMAIL || 'admistater@lnc.com';
const ADMISTATER_PASSWORD = process.env.ADMISTATER_TEST_PASSWORD || 'admistater@lnc.com';

let accessToken = '';
let testProjectId = '';
let testCredentialId = '';
let testUserId = '';

// HTTP request helper
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;

        const options = {
            method,
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        }

        const req = lib.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Test counter
let totalTests = 0;
let passedTests = 0;

function logTest(name, passed, details = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`✅ ${name}`);
    } else {
        console.log(`❌ ${name}`);
        if (details) console.log(`   ${details}`);
    }
}

// Test Suite
async function runTests() {
    console.log('\n========================================');
    console.log('🧪 Testing Admistater Role (Read-Only Access)');
    console.log('========================================\n');
    console.log('ℹ️  Admistater can VIEW everything but CANNOT create/edit/delete\n');

    // Test 1: Login as Admistater
    console.log('📝 Test 1: Login as Admistater');
    try {
        console.log(`Logging in with: ${ADMISTATER_EMAIL}`);
        const res = await makeRequest('POST', '/api/auth/login', {
            email: ADMISTATER_EMAIL,
            password: ADMISTATER_PASSWORD,
        });

        console.log(`Response status: ${res.status}`);
        console.log(`Response data:`, JSON.stringify(res.data, null, 2));

        const passed = res.status === 200 && (res.data.accessToken || res.data.access_token);
        logTest('Login as Admistater', passed,
            passed ? '' : `Status: ${res.status}, Response: ${JSON.stringify(res.data)}`);

        if (passed) {
            accessToken = res.data.accessToken || res.data.access_token;
            console.log(`   Token: ${accessToken.substring(0, 20)}...`);
        } else {
            console.log('\n❌ Cannot proceed without authentication\n');
            return;
        }
    } catch (error) {
        console.error('Exception:', error);
        logTest('Login as Admistater', false, error.message);
        return;
    }

    // Test 2: Verify Token
    console.log('\n📝 Test 2: Verify Access Token');
    try {
        const res = await makeRequest('GET', '/api/auth/verify', null, accessToken);
        const passed = res.status === 200 && res.data.user && res.data.user.roles;
        logTest('Verify Token', passed);
        if (passed) {
            console.log(`   Roles: ${res.data.user.roles.join(', ')}`);
        }
    } catch (error) {
        logTest('Verify Token', false, error.message);
    }

    // Test 3: Create Project (SHOULD FAIL - Read-Only)
    console.log('\n📝 Test 3: Create Project (Should be DENIED)');
    try {
        const res = await makeRequest('POST', '/api/projects', {
            name: `Admistater Test Project ${Date.now()}`,
            password: 'test-password-123',
        }, accessToken);

        const passed = res.status === 403 || res.status === 401;
        logTest('Create Project Denied', passed,
            passed ? 'Correctly denied (read-only)' : `Expected 403/401, got ${res.status}`);

        if (!passed && res.data.project) {
            testProjectId = res.data.project.id;
            console.log(`   ⚠️  WARNING: Admistater was able to create project!`);
        }
    } catch (error) {
        logTest('Create Project Denied', false, error.message);
    }

    // Test 4: List Projects (SHOULD SUCCEED - Read Access)
    console.log('\n📝 Test 4: List All Projects (Should SUCCEED)');
    try {
        const res = await makeRequest('GET', '/api/projects', null, accessToken);
        const passed = res.status === 200 && Array.isArray(res.data);
        logTest('List Projects Allowed', passed);
        if (passed) {
            console.log(`   Found ${res.data.length} project(s) - Read access working ✅`);
            // Use an existing project for further read tests
            if (res.data.length > 0) {
                testProjectId = res.data[0].id;
                console.log(`   Using existing project: ${testProjectId}`);
            }
        }
    } catch (error) {
        logTest('List Projects Allowed', false, error.message);
    }

    // Test 5: Verify Project Password (SHOULD FAIL - No Password Access)
    if (testProjectId) {
        console.log('\n📝 Test 5: Verify Project Password (Should be DENIED)');
        try {
            const res = await makeRequest('POST', '/api/projects/verify', {
                projectId: testProjectId,
                password: 'test-password-123',
            }, accessToken);

            const passed = res.status === 403 || res.status === 401;
            logTest('Verify Password Denied', passed,
                passed ? 'Correctly denied (read-only)' : `Expected 403/401, got ${res.status}`);
        } catch (error) {
            logTest('Verify Password Denied', false, error.message);
        }
    }

    // Test 6: Add Credential to Project (SHOULD FAIL - Read-Only)
    if (testProjectId) {
        console.log('\n📝 Test 6: Add Credential (Should be DENIED)');
        try {
            const res = await makeRequest('POST', '/api/projects/credentials', {
                projectId: testProjectId,
                key: 'API_KEY',
                value: 'secret-api-key-12345',
            }, accessToken);

            const passed = res.status === 403 || res.status === 401;
            logTest('Add Credential Denied', passed,
                passed ? 'Correctly denied (read-only)' : `Expected 403/401, got ${res.status}`);

            if (!passed && res.data.credential) {
                testCredentialId = res.data.credential.id;
                console.log(`   ⚠️  WARNING: Admistater was able to add credential!`);
            }
        } catch (error) {
            logTest('Add Credential Denied', false, error.message);
        }
    }

    // Test 7: List Credentials (SHOULD SUCCEED - Read Access)
    if (testProjectId) {
        console.log('\n📝 Test 7: List Project Credentials (Should SUCCEED)');
        try {
            const res = await makeRequest('GET', `/api/projects/credentials?projectId=${testProjectId}`, null, accessToken);
            const passed = res.status === 200 && Array.isArray(res.data);
            logTest('List Credentials Allowed', passed);
            if (passed) {
                console.log(`   Found ${res.data.length} credential(s) - Read access working ✅`);
                if (res.data.length > 0) {
                    testCredentialId = res.data[0].id;
                }
            }
        } catch (error) {
            logTest('List Credentials Allowed', false, error.message);
        }
    }

    // Test 8: Update Credential (SHOULD FAIL - Read-Only)
    if (testCredentialId) {
        console.log('\n📝 Test 8: Update Credential (Should be DENIED)');
        try {
            const res = await makeRequest('PUT', '/api/projects/credentials', {
                credentialId: testCredentialId,
                key: 'API_KEY_UPDATED',
                value: 'new-secret-value-67890',
            }, accessToken);

            const passed = res.status === 403 || res.status === 401;
            logTest('Update Credential Denied', passed,
                passed ? 'Correctly denied (read-only)' : `Expected 403/401, got ${res.status}`);
        } catch (error) {
            logTest('Update Credential Denied', false, error.message);
        }
    }

    // Test 9: List All Users (SHOULD SUCCEED - Read Access)
    console.log('\n📝 Test 9: List All Users (Should SUCCEED)');
    try {
        const res = await makeRequest('GET', '/api/users/list', null, accessToken);
        const passed = res.status === 200 && Array.isArray(res.data);
        logTest('List All Users Allowed', passed);
        if (passed) {
            console.log(`   Found ${res.data.length} user(s) - Read access working ✅`);
            // Store a test user ID for role update test
            if (res.data.length > 0) {
                testUserId = res.data[0].id;
            }
        }
    } catch (error) {
        logTest('List All Users Allowed', false, error.message);
    }

    // Test 10: Fetch Pending Users (SHOULD SUCCEED - Read Access)
    console.log('\n📝 Test 10: Fetch Pending Users (Should SUCCEED)');
    try {
        const res = await makeRequest('GET', '/api/users/fetch', null, accessToken);
        const passed = res.status === 200 && Array.isArray(res.data);
        logTest('Fetch Pending Users Allowed', passed);
        if (passed) {
            console.log(`   Found ${res.data.length} pending user(s) - Read access working ✅`);
        }
    } catch (error) {
        logTest('Fetch Pending Users Allowed', false, error.message);
    }

    // Test 11: Update User Role (SHOULD FAIL - Read-Only)
    if (testUserId) {
        console.log('\n📝 Test 11: Update User Role (Should be DENIED)');
        try {
            const res = await makeRequest('POST', '/api/users/update-role', {
                userId: testUserId,
                roles: ['admistater', 'dev_admin'],
            }, accessToken);

            const passed = res.status === 403 || res.status === 401;
            logTest('Update User Role Denied', passed,
                passed ? 'Correctly denied (read-only)' : `Expected 403/401, got ${res.status}`);
        } catch (error) {
            logTest('Update User Role Denied', false, error.message);
        }
    }

    // Test 12: Delete Credential (SHOULD FAIL - Read-Only)
    if (testCredentialId) {
        console.log('\n📝 Test 12: Delete Credential (Should be DENIED)');
        try {
            const res = await makeRequest('DELETE', `/api/projects/credentials?credentialId=${testCredentialId}`, null, accessToken);
            const passed = res.status === 403 || res.status === 401;
            logTest('Delete Credential Denied', passed,
                passed ? 'Correctly denied (read-only)' : `Expected 403/401, got ${res.status}`);
        } catch (error) {
            logTest('Delete Credential Denied', false, error.message);
        }
    }

    // Test 13: Delete Project (SHOULD FAIL - Read-Only)
    if (testProjectId) {
        console.log('\n📝 Test 13: Delete Project (Should be DENIED)');
        try {
            const res = await makeRequest('DELETE', `/api/projects?projectId=${testProjectId}`, null, accessToken);
            const passed = res.status === 403 || res.status === 401;
            logTest('Delete Project Denied', passed,
                passed ? 'Correctly denied (read-only)' : `Expected 403/401, got ${res.status}`);
        } catch (error) {
            logTest('Delete Project Denied', false, error.message);
        }
    }

    // Test 14: Verify Project Still Exists (after failed delete)
    if (testProjectId) {
        console.log('\n📝 Test 14: Verify Project Still Exists');
        try {
            const res = await makeRequest('GET', '/api/projects', null, accessToken);
            const passed = res.status === 200 && res.data.some(p => p.id === testProjectId);
            logTest('Project Still Exists', passed,
                passed ? 'Project unchanged (delete was blocked)' : 'Project might have been deleted!');
        } catch (error) {
            logTest('Project Still Exists', false, error.message);
        }
    }

    // Test 15: Logout
    console.log('\n📝 Test 15: Logout');
    try {
        const res = await makeRequest('POST', '/api/auth/logout', null, accessToken);
        const passed = res.status === 200;
        logTest('Logout', passed);
    } catch (error) {
        logTest('Logout', false, error.message);
    }

    // Summary
    console.log('\n========================================');
    console.log('📊 Test Summary - Admistater (Read-Only)');
    console.log('========================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${totalTests - passedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('========================================');
    console.log('\nExpected Behavior:');
    console.log('✅ READ operations should SUCCEED (list projects, users, credentials)');
    console.log('❌ WRITE operations should be DENIED (create, update, delete)');
    console.log('========================================\n');

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Admistater has correct read-only permissions.\n');
    } else {
        console.log('⚠️  Some tests failed. Review the permissions implementation.\n');
    }
}

// Run the test suite
runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
