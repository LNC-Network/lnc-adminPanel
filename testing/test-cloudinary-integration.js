/**
 * Cloudinary Integration Test Suite
 * Tests file upload to Cloudinary for both Content and Chat
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:3000'; // Always use local dev server for tests
const TEST_USER = {
    email: process.env.CONTENT_TEAM_ADMIN_TEST_EMAIL || 'content.admin@lnc.com',
    password: process.env.CONTENT_TEAM_ADMIN_TEST_PASSWORD || 'content.admin@lnc.com'
};

// Test state
let authToken = null;
let testContentId = null;
let testGroupId = null;
let testMessageId = null;

// Color codes for terminal output
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

// Create a test image file (1x1 pixel PNG)
function createTestImage() {
    const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
    ]);

    const filePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(filePath, pngData);
    return filePath;
}

// Login test user
async function testLogin() {
    log('\n📝 Testing Login...', 'blue');

    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            authToken = data.access_token;
            logTest('Login successful', true, `User: ${data.user?.email}\n  Roles: ${data.user?.roles?.join(', ') || 'none'}`);
            return true;
        } else {
            logTest('Login failed', false, data.error || `Status ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Login error', false, error.message);
        return false;
    }
}

// Test Content Upload to Cloudinary
async function testContentUpload() {
    log('\n📤 Testing Content Upload to Cloudinary...', 'blue');

    const testImagePath = createTestImage();

    try {
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(testImagePath);
        const blob = new Blob([fileBuffer], { type: 'image/png' });

        formData.append('file', blob, 'test-image.png');
        formData.append('title', 'Test Cloudinary Upload');
        formData.append('description', 'Testing Cloudinary integration');
        formData.append('category', 'design');
        formData.append('tags', JSON.stringify(['test', 'cloudinary']));

        const response = await fetch(`${BASE_URL}/api/content/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.content) {
            testContentId = data.content.id;
            const hasCloudinaryId = !!data.content.cloudinary_id;
            const hasUrl = !!data.content.url;
            const hasThumbnail = !!data.content.thumbnail_url;

            logTest('Content upload successful', true,
                `ID: ${testContentId}\n  Cloudinary ID: ${data.content.cloudinary_id}\n  URL: ${data.content.url}`
            );
            logTest('Has Cloudinary ID', hasCloudinaryId);
            logTest('Has URL', hasUrl);
            logTest('Has thumbnail', hasThumbnail);

            return hasCloudinaryId && hasUrl;
        } else {
            logTest('Content upload failed', false, data.error || JSON.stringify(data));
            return false;
        }
    } catch (error) {
        logTest('Content upload error', false, error.message);
        return false;
    } finally {
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
    }
}

// Test Fetching Content from Database
async function testFetchContent() {
    log('\n📥 Testing Fetch Content...', 'blue');

    try {
        const response = await fetch(`${BASE_URL}/api/content/upload`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.content) {
            const contentCount = data.content.length;
            const hasTestContent = data.content.some(c => c.id === testContentId);

            logTest('Fetch content successful', true, `Found ${contentCount} items`);
            logTest('Test content found in list', hasTestContent);

            return hasTestContent;
        } else {
            logTest('Fetch content failed', false, data.error || 'No content returned');
            return false;
        }
    } catch (error) {
        logTest('Fetch content error', false, error.message);
        return false;
    }
}

// Test Content Deletion (soft delete)
async function testContentDeletion() {
    log('\n🗑️  Testing Content Deletion...', 'blue');

    if (!testContentId) {
        logTest('No content ID available', false, 'Skip deletion test');
        return false;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/content/upload?id=${testContentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            logTest('Content deletion successful', true, 'Soft deleted from database');
            return true;
        } else {
            logTest('Content deletion failed', false, data.error || 'Unknown error');
            return false;
        }
    } catch (error) {
        logTest('Content deletion error', false, error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    log('╔════════════════════════════════════════════════════╗', 'cyan');
    log('║   CLOUDINARY INTEGRATION TEST SUITE                ║', 'cyan');
    log('╚════════════════════════════════════════════════════╝', 'cyan');

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    const tests = [
        { name: 'Login', fn: testLogin },
        { name: 'Content Upload', fn: testContentUpload },
        { name: 'Fetch Content', fn: testFetchContent },
        { name: 'Content Deletion', fn: testContentDeletion }
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    log('\n╔════════════════════════════════════════════════════╗', 'cyan');
    log('║   TEST SUMMARY                                     ║', 'cyan');
    log('╚════════════════════════════════════════════════════╝', 'cyan');
    log(`Total Tests: ${results.total}`, 'blue');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`,
        results.failed > 0 ? 'yellow' : 'green'
    );

    if (results.failed === 0) {
        log('\n🎉 All tests passed! Cloudinary integration is working correctly.', 'green');
    } else {
        log('\n⚠️  Some tests failed. Check the output above for details.', 'red');
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
