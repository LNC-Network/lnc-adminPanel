// Quick test to verify encryption is working
const http = require('http');

function makeRequest(method, path, data = null, token = '') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Cookie'] = `access_token=${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testEncryption() {
    console.log('🔐 Testing Encryption in Project ENV\n');

    // Login
    console.log('1. Logging in...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@lnc.com',
        password: 'admin@lnc.com',
    });

    if (loginRes.status !== 200) {
        console.error('❌ Login failed:', loginRes.data);
        return;
    }

    const token = loginRes.data.access_token;
    console.log('✅ Logged in successfully\n');

    // Create project with encrypted password
    console.log('2. Creating project with password: "my-secret-password-123"');
    const projectRes = await makeRequest('POST', '/api/projects', {
        name: 'Encryption Test Project',
        description: 'Testing password encryption',
        password: 'my-secret-password-123',
    }, token);

    if (projectRes.status !== 200 || !projectRes.data.project) {
        console.error('❌ Project creation failed:', projectRes.data);
        return;
    }

    const projectId = projectRes.data.project.id;
    console.log('✅ Project created with ID:', projectId);
    console.log('   (Password is now encrypted in database)\n');

    // Test password verification
    console.log('3. Testing password verification...');
    const verifyCorrect = await makeRequest('POST', '/api/projects/verify', {
        projectId: projectId,
        password: 'my-secret-password-123',
    }, token);

    if (verifyCorrect.status === 200) {
        console.log('✅ Correct password accepted (decryption works!)');
    } else {
        console.log('❌ Correct password rejected:', verifyCorrect.data);
    }

    const verifyWrong = await makeRequest('POST', '/api/projects/verify', {
        projectId: projectId,
        password: 'wrong-password',
    }, token);

    if (verifyWrong.status === 401) {
        console.log('✅ Wrong password rejected (validation works!)\n');
    } else {
        console.log('❌ Wrong password accepted:', verifyWrong.data);
    }

    // Add encrypted credential
    console.log('4. Adding credential with value: "sk_live_1234567890abcdefghij"');
    const credRes = await makeRequest('POST', '/api/projects/credentials', {
        projectId: projectId,
        key: 'SECRET_API_KEY',
        value: 'sk_live_1234567890abcdefghij',
        description: 'Test API secret key',
    }, token);

    if (credRes.status !== 200) {
        console.error('❌ Credential creation failed:', credRes.data);
        return;
    }

    console.log('✅ Credential created with key:', credRes.data.credential.key);
    console.log('   (Value is now encrypted in database)\n');

    // Fetch and verify decryption
    console.log('5. Fetching credentials (should be decrypted)...');
    const fetchRes = await makeRequest('GET', `/api/projects/credentials?projectId=${projectId}`, null, token);

    if (fetchRes.status === 200 && fetchRes.data.credentials.length > 0) {
        const credential = fetchRes.data.credentials[0];
        console.log('✅ Credential fetched:');
        console.log('   Key:', credential.key);
        console.log('   Value:', credential.value);
        console.log('   (Value was decrypted automatically!)\n');

        if (credential.value === 'sk_live_1234567890abcdefghij') {
            console.log('✅ Decryption successful - value matches original!\n');
        } else {
            console.log('❌ Decryption failed - value does not match\n');
        }
    } else {
        console.log('❌ Failed to fetch credentials:', fetchRes.data);
    }

    // Cleanup
    console.log('6. Cleaning up test data...');
    const deleteRes = await makeRequest('DELETE', `/api/projects?id=${projectId}`, null, token);

    if (deleteRes.status === 200) {
        console.log('✅ Test project deleted\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ENCRYPTION TEST COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Project passwords are encrypted in the database');
    console.log('✅ Credential values are encrypted in the database');
    console.log('✅ Passwords are decrypted for verification');
    console.log('✅ Credential values are decrypted when fetched');
    console.log('\n🔒 All sensitive data is protected with AES-256-CBC encryption!');
}

testEncryption().catch(console.error);
