/**
 * User-Specific Content Test Suite
 * Tests that users can only see and manage their own content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:3000';

// Test users
const USER_1 = {
    email: 'content.admin@lnc.com',
    password: 'content.admin@lnc.com',
    name: 'Content Admin'
};

const USER_2 = {
    email: 'design.team@lnc.com',
    password: 'Design@Team123',
    name: 'Design Team'
};

// Test state
let user1Token = null;
let user2Token = null;
let user1ContentId = null;
let user2ContentId = null;

// Color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
    const symbol = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`${symbol} ${name}`, color);
    if (details) {
        log(`  ${details}`, 'cyan');
    }
}

// Create test image
function createTestImage(filename = 'test-image.png') {
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64Image, 'base64');
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, buffer);
    return filepath;
}

// Login function
async function login(user) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: user.email,
                password: user.password
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        throw error;
    }
}

// Upload content
async function uploadContent(token, filename, title) {
    try {
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(filename);
        const blob = new Blob([fileBuffer], { type: 'image/png' });

        formData.append('file', blob, path.basename(filename));
        formData.append('title', title);
        formData.append('category', 'design');
        formData.append('description', `Test upload by ${title}`);
        formData.append('tags', JSON.stringify(['test', 'user-specific']));

        const response = await fetch(`${BASE_URL}/api/content/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        return data.content;
    } catch (error) {
        throw error;
    }
}

// Fetch content
async function fetchContent(token) {
    try {
        const response = await fetch(`${BASE_URL}/api/content/upload`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Fetch failed');
        }

        const data = await response.json();
        return data.content;
    } catch (error) {
        throw error;
    }
}

// Try to delete content
async function deleteContent(token, contentId) {
    try {
        const response = await fetch(`${BASE_URL}/api/content/upload?id=${contentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Delete failed');
        }

        return true;
    } catch (error) {
        throw error;
    }
}

// Run tests
async function runTests() {
    let passed = 0;
    let failed = 0;

    log('\n╔════════════════════════════════════════════════════╗', 'blue');
    log('║   USER-SPECIFIC CONTENT TEST SUITE                 ║', 'blue');
    log('╚════════════════════════════════════════════════════╝\n', 'blue');

    try {
        // Test 1: Login both users
        log('📝 Test 1: Login Both Users...', 'yellow');
        try {
            user1Token = await login(USER_1);
            logTest(`Login ${USER_1.name}`, true, `Email: ${USER_1.email}`);
            passed++;
        } catch (error) {
            logTest(`Login ${USER_1.name}`, false, error.message);
            failed++;
        }

        try {
            user2Token = await login(USER_2);
            logTest(`Login ${USER_2.name}`, true, `Email: ${USER_2.email}`);
            passed++;
        } catch (error) {
            logTest(`Login ${USER_2.name}`, false, error.message);
            failed++;
        }

        // Test 2: Upload content for User 1
        log('\n📤 Test 2: Upload Content for User 1...', 'yellow');
        const user1ImagePath = createTestImage('user1-test.png');
        try {
            const content = await uploadContent(user1Token, user1ImagePath, 'User 1 Content');
            user1ContentId = content.id;
            logTest('User 1 content upload', true, `ID: ${user1ContentId}`);
            passed++;
        } catch (error) {
            logTest('User 1 content upload', false, error.message);
            failed++;
        } finally {
            if (fs.existsSync(user1ImagePath)) {
                fs.unlinkSync(user1ImagePath);
            }
        }

        // Test 3: Upload content for User 2
        log('\n📤 Test 3: Upload Content for User 2...', 'yellow');
        const user2ImagePath = createTestImage('user2-test.png');
        try {
            const content = await uploadContent(user2Token, user2ImagePath, 'User 2 Content');
            user2ContentId = content.id;
            logTest('User 2 content upload', true, `ID: ${user2ContentId}`);
            passed++;
        } catch (error) {
            logTest('User 2 content upload', false, error.message);
            failed++;
        } finally {
            if (fs.existsSync(user2ImagePath)) {
                fs.unlinkSync(user2ImagePath);
            }
        }

        // Test 4: Verify User 1 sees only their content
        log('\n🔍 Test 4: User 1 Should Only See Their Own Content...', 'yellow');
        try {
            const user1Content = await fetchContent(user1Token);
            const hasOnlyOwnContent = user1Content.every(item => !item.id.includes(user2ContentId));
            const hasUser1Content = user1Content.some(item => item.id === user1ContentId);

            if (hasOnlyOwnContent && hasUser1Content) {
                logTest('User 1 content isolation', true, `Found ${user1Content.length} items (only their own)`);
                passed++;
            } else {
                logTest('User 1 content isolation', false, 'User 1 can see User 2 content!');
                failed++;
            }
        } catch (error) {
            logTest('User 1 content isolation', false, error.message);
            failed++;
        }

        // Test 5: Verify User 2 sees only their content
        log('\n🔍 Test 5: User 2 Should Only See Their Own Content...', 'yellow');
        try {
            const user2Content = await fetchContent(user2Token);
            const hasOnlyOwnContent = user2Content.every(item => !item.id.includes(user1ContentId));
            const hasUser2Content = user2Content.some(item => item.id === user2ContentId);

            if (hasOnlyOwnContent && hasUser2Content) {
                logTest('User 2 content isolation', true, `Found ${user2Content.length} items (only their own)`);
                passed++;
            } else {
                logTest('User 2 content isolation', false, 'User 2 can see User 1 content!');
                failed++;
            }
        } catch (error) {
            logTest('User 2 content isolation', false, error.message);
            failed++;
        }

        // Test 6: User 1 cannot delete User 2's content
        log('\n🚫 Test 6: User 1 Cannot Delete User 2 Content...', 'yellow');
        try {
            await deleteContent(user1Token, user2ContentId);

            // Verify User 2's content still exists
            const user2Content = await fetchContent(user2Token);
            const stillExists = user2Content.some(item => item.id === user2ContentId && !item.is_deleted);

            if (stillExists) {
                logTest('Delete prevention', true, 'User 2 content protected from User 1');
                passed++;
            } else {
                logTest('Delete prevention', false, 'User 1 was able to delete User 2 content!');
                failed++;
            }
        } catch (error) {
            // Error is expected here - it means delete failed (good!)
            logTest('Delete prevention', true, 'Delete correctly failed (permission denied)');
            passed++;
        }

        // Test 7: User can delete their own content
        log('\n✅ Test 7: User 1 Can Delete Their Own Content...', 'yellow');
        try {
            await deleteContent(user1Token, user1ContentId);
            logTest('Self-delete', true, 'User 1 deleted their own content');
            passed++;
        } catch (error) {
            logTest('Self-delete', false, error.message);
            failed++;
        }

        // Clean up User 2 content
        log('\n🧹 Cleaning up User 2 test content...', 'yellow');
        try {
            await deleteContent(user2Token, user2ContentId);
            log('✓ User 2 content cleaned up', 'green');
        } catch (error) {
            log('Failed to clean up User 2 content', 'red');
        }

    } catch (error) {
        log(`\n❌ Test suite error: ${error.message}`, 'red');
        failed++;
    }

    // Summary
    log('\n╔════════════════════════════════════════════════════╗', 'blue');
    log('║   TEST SUMMARY                                     ║', 'blue');
    log('╚════════════════════════════════════════════════════╝', 'blue');
    log(`Total Tests: ${passed + failed}`, 'cyan');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, 'red');
    log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'cyan');

    if (failed === 0) {
        log('\n🎉 All tests passed! User-specific content filtering works correctly.', 'green');
    } else {
        log('\n⚠️  Some tests failed. Please review the security implementation.', 'red');
    }
}

// Run the tests
runTests().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    process.exit(1);
});
