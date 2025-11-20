// Test Project ENV Feature
// Run: node testing/test-project-env.js
// 
// This script tests all Project ENV API endpoints:
// - Create project (dev_admin/super admin only)
// - Fetch all projects (dev_member/dev_admin/super admin)
// - Verify project password
// - Add credentials to project
// - Fetch project credentials
// - Delete credential (dev_admin/super admin only)
// - Delete project (dev_admin/super admin only)

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
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

// Test state
let accessToken = '';
let testProjectId = null;
let testCredentialId = null;

// Print section header
function printSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}  ${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// Print test result
function printResult(testName, success, details = '') {
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${testName}${colors.reset}`);
  if (details) {
    console.log(`${colors.gray}   ${details}${colors.reset}`);
  }
}

// Test 1: Login to get access token
async function testLogin() {
  printSection('Test 1: Authentication');

  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (response.status === 200 && response.data.access_token) {
      // Extract the Set-Cookie header to get the actual cookie
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        // Parse the cookie from Set-Cookie header
        const cookieMatch = setCookie.find(c => c.includes('access_token'));
        if (cookieMatch) {
          // Extract just the cookie value part (before the first semicolon)
          accessToken = cookieMatch.split(';')[0];
        } else {
          accessToken = `access_token=${response.data.access_token}`;
        }
      } else {
        accessToken = `access_token=${response.data.access_token}`;
      }
      printResult('Login successful', true, `Token obtained for ${TEST_EMAIL}`);
      return true;
    } else {
      printResult('Login failed', false, `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    printResult('Login error', false, error.message);
    return false;
  }
}

// Test 2: Create a new project
async function testCreateProject() {
  printSection('Test 2: Create New Project');

  const projectData = {
    name: 'Test Project ' + Date.now(),
    description: 'This is a test project created by automated testing',
    password: 'test-project-password-123',
  };

  try {
    const response = await makeRequest('POST', '/api/projects', projectData, accessToken);

    if (response.status === 200 && response.data.project) {
      testProjectId = response.data.project.id;
      printResult('Project created successfully', true, `Project ID: ${testProjectId}`);
      console.log(`${colors.gray}   Name: ${projectData.name}${colors.reset}`);
      console.log(`${colors.gray}   Description: ${projectData.description}${colors.reset}`);
      return true;
    } else if (response.status === 403) {
      printResult('Project creation denied', false, 'User lacks required role (dev_admin or super admin)');
      console.log(`${colors.yellow}   ⚠️  This test requires dev_admin or super admin role${colors.reset}`);
      console.log(`${colors.yellow}   ⚠️  Add one of these roles to ${TEST_EMAIL} in the database${colors.reset}`);
      return false;
    } else if (response.status === 404) {
      printResult('User or role not found', false, 'User roles table may not be set up correctly');
      console.log(`${colors.yellow}   ⚠️  Check that user_roles table exists and user has assigned roles${colors.reset}`);
      return false;
    } else if (response.status === 401) {
      printResult('Invalid session', false, 'Session token not found or expired');
      console.log(`${colors.yellow}   ⚠️  The sessions table may not have the login token${colors.reset}`);
      console.log(`${colors.yellow}   ⚠️  Try logging in via the web interface first${colors.reset}`);
      return false;
    } else {
      printResult('Project creation failed', false, `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    printResult('Project creation error', false, error.message);
    return false;
  }
}

// Test 3: Fetch all projects
async function testFetchProjects() {
  printSection('Test 3: Fetch All Projects');

  try {
    const response = await makeRequest('GET', '/api/projects', null, accessToken);

    if (response.status === 200 && response.data.projects) {
      const count = response.data.projects.length;
      printResult('Projects fetched successfully', true, `Found ${count} project(s)`);

      if (count > 0) {
        console.log(`${colors.gray}   Sample projects:${colors.reset}`);
        response.data.projects.slice(0, 3).forEach((project, i) => {
          console.log(`${colors.gray}   ${i + 1}. ${project.name} (ID: ${project.id})${colors.reset}`);
        });
      }
      return true;
    } else {
      printResult('Fetch projects failed', false, `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    printResult('Fetch projects error', false, error.message);
    return false;
  }
}

// Test 4: Verify project password (correct password)
async function testVerifyPasswordCorrect() {
  printSection('Test 4: Verify Project Password (Correct)');

  if (!testProjectId) {
    printResult('Password verification skipped', false, 'No project ID available (project creation may have failed)');
    return false;
  }

  try {
    const response = await makeRequest('POST', '/api/projects/verify', {
      projectId: testProjectId,
      password: 'test-project-password-123',
    }, accessToken);

    if (response.status === 200 && response.data.valid) {
      printResult('Password verification successful', true, 'Correct password accepted');
      return true;
    } else {
      printResult('Password verification failed', false, `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    printResult('Password verification error', false, error.message);
    return false;
  }
}

// Test 5: Verify project password (wrong password)
async function testVerifyPasswordWrong() {
  printSection('Test 5: Verify Project Password (Wrong)');

  if (!testProjectId) {
    printResult('Wrong password test skipped', false, 'No project ID available');
    return false;
  }

  try {
    const response = await makeRequest('POST', '/api/projects/verify', {
      projectId: testProjectId,
      password: 'wrong-password-123',
    }, accessToken);

    if (response.status === 401) {
      printResult('Wrong password correctly rejected', true, 'Invalid password returned 401 as expected');
      return true;
    } else {
      printResult('Wrong password test failed', false, `Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    printResult('Wrong password test error', false, error.message);
    return false;
  }
}

// Test 6: Add credential to project
async function testAddCredential() {
  printSection('Test 6: Add Credential to Project');

  if (!testProjectId) {
    printResult('Add credential skipped', false, 'No project ID available');
    return false;
  }

  const credentialData = {
    projectId: testProjectId,
    key: 'DATABASE_URL',
    value: 'postgresql://user:password@localhost:5432/testdb',
    description: 'Test database connection string',
  };

  try {
    const response = await makeRequest('POST', '/api/projects/credentials', credentialData, accessToken);

    if (response.status === 200 && response.data.credential) {
      testCredentialId = response.data.credential.id;
      printResult('Credential added successfully', true, `Credential ID: ${testCredentialId}`);
      console.log(`${colors.gray}   Key: ${credentialData.key}${colors.reset}`);
      console.log(`${colors.gray}   Description: ${credentialData.description}${colors.reset}`);
      return true;
    } else {
      printResult('Add credential failed', false, `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    printResult('Add credential error', false, error.message);
    return false;
  }
}

// Test 7: Add another credential
async function testAddSecondCredential() {
  printSection('Test 7: Add Second Credential');

  if (!testProjectId) {
    printResult('Add second credential skipped', false, 'No project ID available');
    return false;
  }

  const credentialData = {
    projectId: testProjectId,
    key: 'API_SECRET_KEY',
    value: 'sk_test_1234567890abcdefghijklmnop',
    description: 'API secret key for external service',
  };

  try {
    const response = await makeRequest('POST', '/api/projects/credentials', credentialData, accessToken);

    if (response.status === 200 && response.data.credential) {
      printResult('Second credential added successfully', true, `Credential ID: ${response.data.credential.id}`);
      console.log(`${colors.gray}   Key: ${credentialData.key}${colors.reset}`);
      return true;
    } else {
      printResult('Add second credential failed', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    printResult('Add second credential error', false, error.message);
    return false;
  }
}

// Test 8: Fetch credentials for project
async function testFetchCredentials() {
  printSection('Test 8: Fetch Project Credentials');

  if (!testProjectId) {
    printResult('Fetch credentials skipped', false, 'No project ID available');
    return false;
  }

  try {
    const response = await makeRequest('GET', `/api/projects/credentials?projectId=${testProjectId}`, null, accessToken);

    if (response.status === 200 && response.data.credentials) {
      const count = response.data.credentials.length;
      printResult('Credentials fetched successfully', true, `Found ${count} credential(s)`);

      if (count > 0) {
        console.log(`${colors.gray}   Credentials:${colors.reset}`);
        response.data.credentials.forEach((cred, i) => {
          console.log(`${colors.gray}   ${i + 1}. ${cred.key} - ${cred.description || 'No description'}${colors.reset}`);
        });
      }
      return true;
    } else {
      printResult('Fetch credentials failed', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    printResult('Fetch credentials error', false, error.message);
    return false;
  }
}

// Test 9: Delete credential
async function testDeleteCredential() {
  printSection('Test 9: Delete Credential');

  if (!testCredentialId) {
    printResult('Delete credential skipped', false, 'No credential ID available');
    return false;
  }

  try {
    const response = await makeRequest('DELETE', `/api/projects/credentials?id=${testCredentialId}`, null, accessToken);

    if (response.status === 200) {
      printResult('Credential deleted successfully', true, `Deleted credential ID: ${testCredentialId}`);
      return true;
    } else if (response.status === 403) {
      printResult('Delete credential denied', false, 'User lacks required role (dev_admin or super admin)');
      console.log(`${colors.yellow}   ⚠️  This test requires dev_admin or super admin role${colors.reset}`);
      return false;
    } else {
      printResult('Delete credential failed', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    printResult('Delete credential error', false, error.message);
    return false;
  }
}

// Test 10: Delete project
async function testDeleteProject() {
  printSection('Test 10: Delete Project');

  if (!testProjectId) {
    printResult('Delete project skipped', false, 'No project ID available');
    return false;
  }

  try {
    const response = await makeRequest('DELETE', `/api/projects?id=${testProjectId}`, null, accessToken);

    if (response.status === 200) {
      printResult('Project deleted successfully', true, `Deleted project ID: ${testProjectId}`);
      return true;
    } else if (response.status === 403) {
      printResult('Delete project denied', false, 'User lacks required role (dev_admin or super admin)');
      console.log(`${colors.yellow}   ⚠️  This test requires dev_admin or super admin role${colors.reset}`);
      return false;
    } else {
      printResult('Delete project failed', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    printResult('Delete project error', false, error.message);
    return false;
  }
}

// Test 11: Unauthorized access test
async function testUnauthorizedAccess() {
  printSection('Test 11: Unauthorized Access Test');

  try {
    const response = await makeRequest('GET', '/api/projects', null, ''); // No token

    if (response.status === 401) {
      printResult('Unauthorized access correctly blocked', true, 'Request without token returned 401');
      return true;
    } else {
      printResult('Unauthorized access test failed', false, `Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    printResult('Unauthorized access test error', false, error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║         PROJECT ENV FEATURE - COMPREHENSIVE TEST           ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.gray}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.gray}Test User: ${TEST_EMAIL}${colors.reset}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Run tests in sequence
  const tests = [
    testLogin,
    testUnauthorizedAccess,
    testCreateProject,
    testFetchProjects,
    testVerifyPasswordCorrect,
    testVerifyPasswordWrong,
    testAddCredential,
    testAddSecondCredential,
    testFetchCredentials,
    testDeleteCredential,
    testDeleteProject,
  ];

  for (const test of tests) {
    results.total++;
    const success = await test();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  printSection('Test Summary');
  console.log(`${colors.blue}Total Tests: ${results.total}${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

  const percentage = ((results.passed / results.total) * 100).toFixed(1);
  const passColor = percentage >= 80 ? colors.green : percentage >= 50 ? colors.yellow : colors.red;
  console.log(`${passColor}Success Rate: ${percentage}%${colors.reset}\n`);

  if (results.failed > 0) {
    console.log(`${colors.yellow}⚠️  Some tests failed. Common reasons:${colors.reset}`);
    console.log(`${colors.gray}   - User doesn't have required role (dev_member, dev_admin, or super admin)${colors.reset}`);
    console.log(`${colors.gray}   - Database tables not created (run database-projects-env.sql)${colors.reset}`);
    console.log(`${colors.gray}   - Server not running on ${BASE_URL}${colors.reset}`);
    console.log(`${colors.gray}   - Invalid test credentials${colors.reset}\n`);
  }

  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// Check if server is running before starting tests
async function checkServer() {
  try {
    const response = await makeRequest('GET', '/api/auth/verify', null, '');
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Cannot connect to ${BASE_URL}${colors.reset}`);
    console.error(`${colors.yellow}Please make sure the server is running with: npm run dev${colors.reset}\n`);
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runAllTests();
  }
})().catch(console.error);
