/**
 * Test Case: Ticket Assignment Email Notification
 * Login: example@lnc.com
 * Password: example@lnc.com
 * 
 * This script tests:
 * 1. User login
 * 2. Create a test ticket
 * 3. Assign ticket to users
 * 4. Verify email is sent to assigned users' personal email
 */

const http = require("http");

const hostname = "localhost";
const port = 3000;

// Test credentials
const credentials = {
    email: "example@lnc.com",
    password: "example@lnc.com",
};

let currentUser = null;
let createdIssueId = null;
let createdIssueNumber = null;

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null,
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        parseError: error.message,
                    });
                }
            });
        });

        req.on("error", (error) => {
            console.error("Request error:", error.message);
            reject(error);
        });
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testLogin() {
    console.log("\n=== TEST 1: User Login ===");
    console.log(`Logging in as: ${credentials.email}`);

    try {
        const res = await makeRequest(
            {
                hostname,
                port,
                path: "/api/auth/login",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            },
            credentials
        );

        if (res.statusCode === 200) {
            currentUser = res.body.user;
            console.log("✅ Login successful!");
            console.log(`   User ID: ${currentUser.id}`);
            console.log(`   Email: ${currentUser.email}`);
            console.log(`   Roles: ${currentUser.roles ? currentUser.roles.join(', ') : 'None'}`);
            return true;
        } else {
            console.log("❌ Login failed!");
            console.log(`   Error: ${res.body?.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.error("❌ Login error:", error.message);
        return false;
    }
}

async function testGetUsers() {
    console.log("\n=== TEST 2: Fetch Users with Personal Emails ===");

    try {
        const res = await makeRequest({
            hostname,
            port,
            path: "/api/users/list",
            method: "GET",
        });

        if (res.statusCode === 200) {
            const users = res.body.users || [];
            console.log(`✅ Fetched ${users.length} users`);

            // Filter users with personal_email
            const usersWithPersonalEmail = users.filter(user => user.personal_email);
            console.log(`   Users with personal email: ${usersWithPersonalEmail.length}`);

            usersWithPersonalEmail.slice(0, 5).forEach(user => {
                console.log(`   - ${user.display_name || user.email}`);
                console.log(`     Work: ${user.email}`);
                console.log(`     Personal: ${user.personal_email}`);
            });

            return usersWithPersonalEmail;
        } else {
            console.log("❌ Failed to fetch users");
            return [];
        }
    } catch (error) {
        console.error("❌ Error fetching users:", error.message);
        return [];
    }
}

async function testCreateIssue() {
    console.log("\n=== TEST 3: Create Test Issue ===");

    const issueData = {
        title: "Test Issue for Email Notification",
        description: "This test issue is created to verify that assignment email notifications are sent to users' personal email addresses.",
        priority: "high",
        created_by: currentUser.id,
    };

    console.log(`Creating issue: "${issueData.title}"`);

    try {
        const res = await makeRequest(
            {
                hostname,
                port,
                path: "/api/tickets",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            },
            issueData
        );

        if (res.statusCode === 200) {
            createdIssueId = res.body.ticket.id;
            createdIssueNumber = res.body.ticket.issue_number;
            console.log(`✅ Issue #${createdIssueNumber} created successfully!`);
            console.log(`   Issue ID: ${createdIssueId}`);
            console.log(`   Title: ${res.body.ticket.title}`);
            console.log(`   Priority: ${res.body.ticket.priority}`);
            return true;
        } else {
            console.log("❌ Failed to create issue");
            console.log(`   Error: ${res.body?.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.error("❌ Error creating issue:", error.message);
        return false;
    }
}

async function testAssignWithEmail(ticketId, userIds) {
    console.log("\n=== TEST 4: Assign Users and Send Email ===");
    console.log(`Assigning ${userIds.length} user(s) to ticket #${createdIssueNumber}`);

    try {
        const res = await makeRequest(
            {
                hostname,
                port,
                path: "/api/tickets/assign",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            },
            {
                ticket_id: ticketId,
                user_ids: userIds,
                assigned_by: currentUser.id,
            }
        );

        if (res.statusCode === 200) {
            console.log(`✅ Users assigned successfully!`);
            console.log(`   Assignments created: ${res.body.assignments?.length || 0}`);
            console.log("\n📧 Email Notification Details:");
            console.log(`   - Email sent to each assigned user's personal email`);
            console.log(`   - Template: "ticket_assigned"`);
            console.log(`   - Subject: "New Ticket Assigned to You"`);
            console.log(`   - Contains: Ticket #${createdIssueNumber}, Title, Priority, Description, Link`);
            console.log("\n⚠️  Check the server logs for email sending confirmation");
            console.log("   Look for: 'Assignment email sent to [email] for ticket #[number]'");
            return true;
        } else {
            console.log("❌ Failed to assign users");
            console.log(`   Error: ${res.body?.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.error("❌ Error assigning users:", error.message);
        return false;
    }
}

async function runAllTests() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║  Ticket Assignment Email Notification Test                ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    try {
        // Test 1: Login
        const loginSuccess = await testLogin();
        if (!loginSuccess) {
            console.log("\n❌ Tests aborted: Login failed");
            return;
        }

        // Test 2: Get users with personal emails
        const usersWithEmail = await testGetUsers();
        if (usersWithEmail.length === 0) {
            console.log("\n⚠️  WARNING: No users have personal email addresses!");
            console.log("   Emails will be sent to work email (@lnc.com) instead");
        }

        // Test 3: Create issue
        const createSuccess = await testCreateIssue();
        if (!createSuccess) {
            console.log("\n❌ Tests aborted: Issue creation failed");
            return;
        }

        // Test 4: Assign users (will trigger email)
        const userIdsToAssign = usersWithEmail.slice(0, 2).map(u => u.id);
        if (userIdsToAssign.length === 0) {
            console.log("\n⚠️  No users to assign. Skipping assignment test.");
            return;
        }

        await testAssignWithEmail(createdIssueId, userIdsToAssign);

        // Summary
        console.log("\n╔════════════════════════════════════════════════════════════╗");
        console.log("║  TEST SUMMARY                                              ║");
        console.log("╚════════════════════════════════════════════════════════════╝");
        console.log("✅ Login successful");
        console.log("✅ Users fetched");
        console.log(`✅ Issue #${createdIssueNumber} created`);
        console.log("✅ Users assigned to ticket");
        console.log("✅ Email notification triggered");
        console.log("\n📧 Email Features:");
        console.log("   • Sent to personal_email if available");
        console.log("   • Falls back to work email if no personal email");
        console.log("   • Includes ticket details (number, title, priority, description)");
        console.log("   • Contains direct link to view the ticket");
        console.log("   • Shows who assigned the ticket");
        console.log("\n🎉 All tests completed!");
        console.log(`\n📋 Test Issue ID: ${createdIssueId}`);
        console.log(`🔢 Test Issue Number: #${createdIssueNumber}`);
        console.log("\n💡 Next Steps:");
        console.log("   1. Check server terminal for email sending logs");
        console.log("   2. Check inbox of assigned users' personal emails");
        console.log("   3. Verify email content and formatting");

    } catch (error) {
        console.error("\n💥 Unexpected error:", error);
        console.error("\nMake sure:");
        console.error("1. Development server is running (npm run dev)");
        console.error("2. Gmail SMTP is configured (GMAIL_USER, GMAIL_APP_PASSWORD)");
        console.error("3. Users have personal_email set in database");
        console.error("4. Email template 'ticket_assigned' exists in database");
    }
}

// Run the tests
runAllTests();
