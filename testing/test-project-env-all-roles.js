// Test Project ENV Feature with All Roles
// Run: node testing/test-project-env-all-roles.js
// 
// This script tests Project ENV feature with different user roles:
// - Super Admin (full access)
// - Dev Team Admin (can create, delete projects and credentials)
// - Dev Member (can view projects, add credentials, but cannot delete)

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/); // Handle both \n and \r\n
    lines.forEach((line) => {
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
}// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Test users from .env
const TEST_USERS = {
    superAdmin: {
        email: process.env.SUPER_ADMIN_TEST_EMAIL || process.env.TEST_EMAIL,
        password: process.env.SUPER_ADMIN_TEST_PASSWORD || process.env.TEST_PASSWORD,
        role: 'Super Admin',
        expectedPermissions: {
            createProject: true,
            viewProjects: true,
            addCredential: true,
            deleteCredential: true,
            deleteProject: true,
        }
    },
    devAdmin: {
        email: process.env.DEV_TEAM_ADMIN_TEST_EMAIL,
        password: process.env.DEV_TEAM_ADMIN_TEST_PASSWORD,
        role: 'Dev Team Admin',
        expectedPermissions: {
            createProject: true,
            viewProjects: true,
            addCredential: true,
            deleteCredential: true,
            deleteProject: true,
        }
    },
    devMember: {
        email: process.env.DEV_MEMBER_TEST_EMAIL,
        password: process.env.DEV_MEMBER_TEST_PASSWORD,
        role: 'Dev Member',
        expectedPermissions: {
            createProject: false,
            viewProjects: true,
            addCredential: true,
            deleteCredential: false,
            deleteProject: false,
        }
    },
};

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, cookies = '') {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (cookies) {
            options.headers['Cookie'] = cookies;
        }

        const req = lib.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    const response = {
                        status: res.statusCode,
                        headers: res.headers,
                        data: body ? JSON.parse(body) : null,
                    };
                    resolve(response);
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: body,
                    });
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

// Print section header
function printSection(title, color = colors.blue) {
    console.log(`\n${color}${'='.repeat(70)}${colors.reset}`);
    console.log(`${color}  ${title}${colors.reset}`);
    console.log(`${color}${'='.repeat(70)}${colors.reset}\n`);
}

// Print test result
function printResult(testName, success, details = '', indent = '') {
    const icon = success ? '✅' : '❌';
    const color = success ? colors.green : colors.red;
    console.log(`${indent}${color}${icon} ${testName}${colors.reset}`);
    if (details) {
        console.log(`${indent}${colors.gray}   ${details}${colors.reset}`);
    }
}

// Login user
async function login(email, password) {
    try {
        const response = await makeRequest('POST', '/api/auth/login', {
            email,
            password,
        });

        if (response.status === 200 && response.data.access_token) {
            const setCookie = response.headers['set-cookie'];
            let token = `access_token=${response.data.access_token}`;
            if (setCookie) {
                const cookieMatch = setCookie.find(c => c.includes('access_token'));
                if (cookieMatch) {
                    token = cookieMatch.split(';')[0];
                }
            }
            return { success: true, token };
        } else {
            return { success: false, error: response.data?.error || 'Login failed' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test: Create Project
async function testCreateProject(token, shouldSucceed) {
    const projectData = {
        name: 'Test Project ' + Date.now(),
        description: 'Created by automated role-based testing',
        password: 'test-password-' + Date.now(),
    };

    try {
        const response = await makeRequest('POST', '/api/projects', projectData, token);

        if (shouldSucceed) {
            if (response.status === 200 && response.data.project) {
                return {
                    success: true,
                    projectId: response.data.project.id,
                    projectName: projectData.name,
                    password: projectData.password,
                };
            } else {
                return {
                    success: false,
                    error: `Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`,
                };
            }
        } else {
            if (response.status === 403) {
                return { success: true, blocked: true };
            } else {
                return {
                    success: false,
                    error: `Expected 403 (forbidden), got ${response.status}`,
                };
            }
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test: View Projects
async function testViewProjects(token) {
    try {
        const response = await makeRequest('GET', '/api/projects', null, token);

        if (response.status === 200 && response.data.projects) {
            return {
                success: true,
                count: response.data.projects.length,
                projects: response.data.projects,
            };
        } else {
            return {
                success: false,
                error: `Status ${response.status}: ${JSON.stringify(response.data)}`,
            };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test: Verify Password
async function testVerifyPassword(token, projectId, password, shouldSucceed) {
    try {
        const response = await makeRequest('POST', '/api/projects/verify', {
            projectId,
            password,
        }, token);

        if (shouldSucceed) {
            return response.status === 200 ? { success: true } : { success: false, error: `Status ${response.status}` };
        } else {
            return response.status === 401 ? { success: true, blocked: true } : { success: false, error: `Expected 401, got ${response.status}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test: Add Credential
async function testAddCredential(token, projectId, shouldSucceed) {
    const credData = {
        projectId,
        key: 'TEST_KEY_' + Date.now(),
        value: 'test-value-' + Math.random().toString(36).substring(7),
        description: 'Test credential for role-based testing',
    };

    try {
        const response = await makeRequest('POST', '/api/projects/credentials', credData, token);

        if (shouldSucceed) {
            if (response.status === 200 && response.data.credential) {
                return {
                    success: true,
                    credentialId: response.data.credential.id,
                    key: credData.key,
                };
            } else {
                return {
                    success: false,
                    error: `Status ${response.status}: ${JSON.stringify(response.data)}`,
                };
            }
        } else {
            if (response.status === 403) {
                return { success: true, blocked: true };
            } else {
                return {
                    success: false,
                    error: `Expected 403, got ${response.status}`,
                };
            }
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test: Delete Credential
async function testDeleteCredential(token, credentialId, shouldSucceed) {
    try {
        const response = await makeRequest('DELETE', `/api/projects/credentials?id=${credentialId}`, null, token);

        if (shouldSucceed) {
            return response.status === 200 ? { success: true } : { success: false, error: `Status ${response.status}` };
        } else {
            return response.status === 403 ? { success: true, blocked: true } : { success: false, error: `Expected 403, got ${response.status}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test: Delete Project
async function testDeleteProject(token, projectId, shouldSucceed) {
    try {
        const response = await makeRequest('DELETE', `/api/projects?id=${projectId}`, null, token);

        if (shouldSucceed) {
            return response.status === 200 ? { success: true } : { success: false, error: `Status ${response.status}` };
        } else {
            return response.status === 403 ? { success: true, blocked: true } : { success: false, error: `Expected 403, got ${response.status}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test suite for a specific role
async function testRole(userType, userData) {
    const results = { total: 0, passed: 0, failed: 0 };

    printSection(`Testing Role: ${userData.role} (${userData.email})`, colors.magenta);

    // Login
    console.log(`${colors.blue}→ Step 1: Authentication${colors.reset}`);
    const loginResult = await login(userData.email, userData.password);
    results.total++;

    if (!loginResult.success) {
        printResult('Login', false, loginResult.error, '  ');
        results.failed++;
        console.log(`${colors.red}\n⚠️  Cannot proceed with tests for ${userData.role} - Login failed\n${colors.reset}`);
        return results;
    }

    printResult('Login', true, `Authenticated as ${userData.role}`, '  ');
    results.passed++;

    const token = loginResult.token;
    let projectId = null;
    let projectPassword = null;
    let credentialId = null;

    // Test: View Projects
    console.log(`\n${colors.blue}→ Step 2: View Projects${colors.reset}`);
    results.total++;
    const viewResult = await testViewProjects(token);
    if (viewResult.success) {
        printResult('View Projects', true, `Found ${viewResult.count} project(s)`, '  ');
        results.passed++;
    } else {
        printResult('View Projects', false, viewResult.error, '  ');
        results.failed++;
    }

    // Test: Create Project
    console.log(`\n${colors.blue}→ Step 3: Create Project${colors.reset}`);
    results.total++;
    const createResult = await testCreateProject(token, userData.expectedPermissions.createProject);

    if (userData.expectedPermissions.createProject) {
        if (createResult.success && !createResult.blocked) {
            printResult('Create Project', true, `Created project ID: ${createResult.projectId}`, '  ');
            results.passed++;
            projectId = createResult.projectId;
            projectPassword = createResult.password;
        } else {
            printResult('Create Project', false, createResult.error, '  ');
            results.failed++;
        }
    } else {
        if (createResult.success && createResult.blocked) {
            printResult('Create Project Blocked (Expected)', true, 'Correctly denied access', '  ');
            results.passed++;
        } else {
            printResult('Create Project Should Be Blocked', false, createResult.error, '  ');
            results.failed++;
        }
    }

    // If we couldn't create a project, try to use an existing one for remaining tests
    if (!projectId && viewResult.success && viewResult.projects.length > 0) {
        projectId = viewResult.projects[0].id;
        console.log(`${colors.yellow}  ℹ️  Using existing project ID ${projectId} for remaining tests${colors.reset}`);
    }

    if (!projectId) {
        console.log(`${colors.yellow}\n⚠️  No project available for remaining tests\n${colors.reset}`);
        return results;
    }

    // Test: Verify Correct Password (skip if we don't have password)
    if (projectPassword) {
        console.log(`\n${colors.blue}→ Step 4: Verify Correct Password${colors.reset}`);
        results.total++;
        const verifyCorrect = await testVerifyPassword(token, projectId, projectPassword, true);
        if (verifyCorrect.success) {
            printResult('Verify Correct Password', true, 'Password accepted', '  ');
            results.passed++;
        } else {
            printResult('Verify Correct Password', false, verifyCorrect.error, '  ');
            results.failed++;
        }

        // Test: Verify Wrong Password
        console.log(`\n${colors.blue}→ Step 5: Verify Wrong Password${colors.reset}`);
        results.total++;
        const verifyWrong = await testVerifyPassword(token, projectId, 'wrong-password-123', false);
        if (verifyWrong.success) {
            printResult('Verify Wrong Password Rejected', true, 'Correctly rejected invalid password', '  ');
            results.passed++;
        } else {
            printResult('Verify Wrong Password', false, verifyWrong.error, '  ');
            results.failed++;
        }
    }

    // Test: Add Credential
    console.log(`\n${colors.blue}→ Step ${projectPassword ? '6' : '4'}: Add Credential${colors.reset}`);
    results.total++;
    const addCredResult = await testAddCredential(token, projectId, userData.expectedPermissions.addCredential);

    if (userData.expectedPermissions.addCredential) {
        if (addCredResult.success && !addCredResult.blocked) {
            printResult('Add Credential', true, `Created credential: ${addCredResult.key}`, '  ');
            results.passed++;
            credentialId = addCredResult.credentialId;
        } else {
            printResult('Add Credential', false, addCredResult.error, '  ');
            results.failed++;
        }
    } else {
        if (addCredResult.success && addCredResult.blocked) {
            printResult('Add Credential Blocked (Expected)', true, 'Correctly denied access', '  ');
            results.passed++;
        } else {
            printResult('Add Credential Should Be Blocked', false, addCredResult.error, '  ');
            results.failed++;
        }
    }

    // Test: Delete Credential
    if (credentialId) {
        console.log(`\n${colors.blue}→ Step ${projectPassword ? '7' : '5'}: Delete Credential${colors.reset}`);
        results.total++;
        const deleteCredResult = await testDeleteCredential(token, credentialId, userData.expectedPermissions.deleteCredential);

        if (userData.expectedPermissions.deleteCredential) {
            if (deleteCredResult.success && !deleteCredResult.blocked) {
                printResult('Delete Credential', true, `Deleted credential ID: ${credentialId}`, '  ');
                results.passed++;
            } else {
                printResult('Delete Credential', false, deleteCredResult.error, '  ');
                results.failed++;
            }
        } else {
            if (deleteCredResult.success && deleteCredResult.blocked) {
                printResult('Delete Credential Blocked (Expected)', true, 'Correctly denied access', '  ');
                results.passed++;
            } else {
                printResult('Delete Credential Should Be Blocked', false, deleteCredResult.error, '  ');
                results.failed++;
            }
        }
    }

    // Test: Delete Project (only if we created it)
    if (projectId && createResult.projectId) {
        console.log(`\n${colors.blue}→ Step ${projectPassword ? '8' : '6'}: Delete Project${colors.reset}`);
        results.total++;
        const deleteProjectResult = await testDeleteProject(token, projectId, userData.expectedPermissions.deleteProject);

        if (userData.expectedPermissions.deleteProject) {
            if (deleteProjectResult.success && !deleteProjectResult.blocked) {
                printResult('Delete Project', true, `Deleted project ID: ${projectId}`, '  ');
                results.passed++;
            } else {
                printResult('Delete Project', false, deleteProjectResult.error, '  ');
                results.failed++;
            }
        } else {
            if (deleteProjectResult.success && deleteProjectResult.blocked) {
                printResult('Delete Project Blocked (Expected)', true, 'Correctly denied access', '  ');
                results.passed++;
            } else {
                printResult('Delete Project Should Be Blocked', false, deleteProjectResult.error, '  ');
                results.failed++;
            }
        }
    }

    // Summary for this role
    const percentage = ((results.passed / results.total) * 100).toFixed(1);
    const passColor = percentage >= 80 ? colors.green : percentage >= 50 ? colors.yellow : colors.red;
    console.log(`\n${colors.gray}──────────────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${passColor}  ${userData.role} Results: ${results.passed}/${results.total} passed (${percentage}%)${colors.reset}`);
    console.log(`${colors.gray}──────────────────────────────────────────────────────────────────────${colors.reset}\n`);

    return results;
}

// Main execution
async function runAllTests() {
    console.log(`\n${colors.blue}╔══════════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║     PROJECT ENV - ROLE-BASED ACCESS CONTROL TEST SUITE              ║${colors.reset}`);
    console.log(`${colors.blue}╚══════════════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`${colors.gray}Base URL: ${BASE_URL}${colors.reset}`);
    console.log(`${colors.gray}Testing 3 different user roles with their respective permissions${colors.reset}\n`);

    const overallResults = { total: 0, passed: 0, failed: 0 };

    // Test each role
    for (const [userType, userData] of Object.entries(TEST_USERS)) {
        if (!userData.email || !userData.password) {
            console.log(`${colors.yellow}⚠️  Skipping ${userData.role} - credentials not found in .env${colors.reset}\n`);
            continue;
        }

        const results = await testRole(userType, userData);
        overallResults.total += results.total;
        overallResults.passed += results.passed;
        overallResults.failed += results.failed;

        // Small delay between role tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Overall Summary
    printSection('Overall Test Summary', colors.blue);
    console.log(`${colors.blue}Total Tests Across All Roles: ${overallResults.total}${colors.reset}`);
    console.log(`${colors.green}Passed: ${overallResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${overallResults.failed}${colors.reset}`);

    const percentage = ((overallResults.passed / overallResults.total) * 100).toFixed(1);
    const passColor = percentage >= 80 ? colors.green : percentage >= 50 ? colors.yellow : colors.red;
    console.log(`${passColor}Overall Success Rate: ${percentage}%${colors.reset}\n`);

    console.log(`${colors.blue}╔══════════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║                        PERMISSION MATRIX                             ║${colors.reset}`);
    console.log(`${colors.blue}╠══════════════════════════════════════════════════════════════════════╣${colors.reset}`);
    console.log(`${colors.blue}║  Action              │ Super Admin │ Dev Admin │ Dev Member          ║${colors.reset}`);
    console.log(`${colors.blue}╠══════════════════════════════════════════════════════════════════════╣${colors.reset}`);
    console.log(`${colors.blue}║  View Projects       │      ✓      │     ✓     │      ✓              ║${colors.reset}`);
    console.log(`${colors.blue}║  Create Project      │      ✓      │     ✓     │      ✗              ║${colors.reset}`);
    console.log(`${colors.blue}║  Add Credential      │      ✓      │     ✓     │      ✓              ║${colors.reset}`);
    console.log(`${colors.blue}║  Delete Credential   │      ✓      │     ✓     │      ✗              ║${colors.reset}`);
    console.log(`${colors.blue}║  Delete Project      │      ✓      │     ✓     │      ✗              ║${colors.reset}`);
    console.log(`${colors.blue}╚══════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    if (overallResults.failed > 0) {
        console.log(`${colors.yellow}⚠️  Some tests failed. Check the detailed results above.${colors.reset}\n`);
    } else {
        console.log(`${colors.green}🎉 All tests passed! Role-based access control is working correctly.${colors.reset}\n`);
    }
}

// Check server and run tests
(async () => {
    try {
        await makeRequest('GET', '/api/auth/verify', null, '');
        await runAllTests();
    } catch (error) {
        console.error(`${colors.red}❌ Cannot connect to ${BASE_URL}${colors.reset}`);
        console.error(`${colors.yellow}Please make sure the server is running with: npm run dev${colors.reset}\n`);
    }
})().catch(console.error);
