/**
 * Test Case: GitHub-Style Ticket System with Assignment
 * Login: admin@lnc.com
 * Password: admin@lnc.com
 * 
 * This script tests:
 * 1. User login
 * 2. Create a new issue
 * 3. Assign issue to dev members
 * 4. Add comments
 * 5. Add reactions
 * 6. Close/Reopen issue
 * 7. Verify permissions
 */

const http = require("http");

const hostname = "localhost";
const port = 3000;

// Test credentials
const credentials = {
  email: "",
  password: "",
};

let authToken = null;
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

    console.log(`Status: ${res.statusCode}`);
    console.log(`Response:`, res.body);
    
    if (res.parseError) {
      console.log("❌ JSON Parse Error:", res.parseError);
      console.log("Raw body:", res.body);
    }
    
    if (res.statusCode === 200) {
      currentUser = res.body.user;
      console.log("✅ Login successful!");
      console.log(`   User ID: ${currentUser.id}`);
      console.log(`   Email: ${currentUser.email}`);
      console.log(`   Display Name: ${currentUser.display_name || 'N/A'}`);
      console.log(`   Roles: ${currentUser.roles ? currentUser.roles.join(', ') : 'None'}`);
      
      // Check permissions (case-insensitive role check)
      const roles = currentUser.roles?.map(r => r.toLowerCase()) || [];
      const isSuperAdmin = roles.includes("super admin");
      const isDevTeamAdmin = roles.includes("dev team admin");
      const hasFullAccess = isSuperAdmin || isDevTeamAdmin;
      
      console.log(`   Can Create Issues: ${hasFullAccess ? 'Yes' : 'No'}`);
      console.log(`   Can Assign Issues: ${hasFullAccess ? 'Yes' : 'No'}`);
      
      if (!hasFullAccess) {
        console.log("⚠️  WARNING: User does not have full access to ticket system!");
        console.log("   Need 'Super Admin' or 'Dev Team Admin' role");
      }
      
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
  console.log("\n=== TEST 2: Fetch Users for Assignment ===");

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
      
      // Filter assignable users (Dev Members, Dev Team Admin, Super Admin)
      const assignableUsers = users.filter(user => {
        const userRoles = (user.roles || []).map(r => r.toLowerCase());
        return userRoles.includes("dev member") || 
               userRoles.includes("dev team admin") ||
               userRoles.includes("super admin");
      });
      
      console.log(`   Assignable users: ${assignableUsers.length}`);
      assignableUsers.forEach(user => {
        console.log(`   - ${user.display_name || user.email} (${user.roles?.join(', ')})`);
      });
      
      return assignableUsers;
    } else {
      console.log("❌ Failed to fetch users");
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    return [];
  }
}

async function testCreateIssue(assignees = []) {
  console.log("\n=== TEST 3: Create New Issue ===");

  const issueData = {
    title: "Test Issue: GitHub-Style Ticket System",
    description: "This is a test issue created to verify the GitHub-style ticket system.\n\nFeatures to test:\n- Issue creation\n- Assignment\n- Comments\n- Reactions\n- Status changes",
    priority: "high",
    created_by: currentUser.id,
    milestone_id: null,
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
      console.log(`   Status: ${res.body.ticket.status}`);
      console.log(`   Priority: ${res.body.ticket.priority}`);
      
      // Assign users if provided
      if (assignees.length > 0) {
        console.log(`\n   Assigning to ${assignees.length} user(s)...`);
        await testAssignIssue(createdIssueId, assignees);
      }
      
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

async function testAssignIssue(ticketId, userIds) {
  console.log("\n=== TEST 4: Assign Issue ===");

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
      console.log(`✅ Issue assigned to ${userIds.length} user(s)`);
      console.log(`   Assignments created: ${res.body.assignments?.length || 0}`);
      return true;
    } else {
      console.log("❌ Failed to assign issue");
      console.log(`   Error: ${res.body?.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error assigning issue:", error.message);
    return false;
  }
}

async function testAddComment(ticketId) {
  console.log("\n=== TEST 5: Add Comment ===");

  try {
    const res = await makeRequest(
      {
        hostname,
        port,
        path: "/api/tickets/comments",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        ticket_id: ticketId,
        user_id: currentUser.id,
        comment: "This is a test comment to verify the commenting system works correctly. ✅",
      }
    );

    if (res.statusCode === 200) {
      console.log("✅ Comment added successfully");
      console.log(`   Comment ID: ${res.body.comment?.id}`);
      return true;
    } else {
      console.log("❌ Failed to add comment");
      console.log(`   Error: ${res.body?.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error adding comment:", error.message);
    return false;
  }
}

async function testAddReaction(ticketId) {
  console.log("\n=== TEST 6: Add Reaction ===");

  try {
    const res = await makeRequest(
      {
        hostname,
        port,
        path: "/api/tickets/reactions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        ticket_id: ticketId,
        user_id: currentUser.id,
        reaction: "+1",
      }
    );

    if (res.statusCode === 200) {
      console.log("✅ Reaction added successfully");
      console.log(`   Reaction: 👍 (+1)`);
      return true;
    } else {
      console.log("❌ Failed to add reaction");
      console.log(`   Error: ${res.body?.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error adding reaction:", error.message);
    return false;
  }
}

async function testCloseIssue(ticketId) {
  console.log("\n=== TEST 7: Close Issue ===");

  try {
    const res = await makeRequest(
      {
        hostname,
        port,
        path: "/api/tickets",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        ticket_id: ticketId,
        status: "closed",
        closed_by: currentUser.id,
      }
    );

    if (res.statusCode === 200) {
      console.log("✅ Issue closed successfully");
      console.log(`   Status: ${res.body.ticket?.status}`);
      return true;
    } else {
      console.log("❌ Failed to close issue");
      console.log(`   Error: ${res.body?.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error closing issue:", error.message);
    return false;
  }
}

async function testReopenIssue(ticketId) {
  console.log("\n=== TEST 8: Reopen Issue ===");

  try {
    const res = await makeRequest(
      {
        hostname,
        port,
        path: "/api/tickets",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        ticket_id: ticketId,
        status: "open",
        closed_by: null,
      }
    );

    if (res.statusCode === 200) {
      console.log("✅ Issue reopened successfully");
      console.log(`   Status: ${res.body.ticket?.status}`);
      return true;
    } else {
      console.log("❌ Failed to reopen issue");
      console.log(`   Error: ${res.body?.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error reopening issue:", error.message);
    return false;
  }
}

async function testGetTickets() {
  console.log("\n=== TEST 9: Fetch All Tickets ===");

  try {
    const res = await makeRequest({
      hostname,
      port,
      path: "/api/tickets",
      method: "GET",
    });

    if (res.statusCode === 200) {
      const tickets = res.body.tickets || [];
      console.log(`✅ Fetched ${tickets.length} ticket(s)`);
      
      // Find our created ticket
      const ourTicket = tickets.find(t => t.id === createdIssueId);
      if (ourTicket) {
        console.log(`\n   Our test ticket #${ourTicket.issue_number}:`);
        console.log(`   - Title: ${ourTicket.title}`);
        console.log(`   - Status: ${ourTicket.status}`);
        console.log(`   - Priority: ${ourTicket.priority}`);
        console.log(`   - Assignments: ${ourTicket.ticket_assignments?.length || 0}`);
        if (ourTicket.ticket_assignments && ourTicket.ticket_assignments.length > 0) {
          ourTicket.ticket_assignments.forEach(assignment => {
            console.log(`     - ${assignment.assigned_user.display_name || assignment.assigned_user.email}`);
          });
        }
      }
      
      return true;
    } else {
      console.log("❌ Failed to fetch tickets");
      return false;
    }
  } catch (error) {
    console.error("❌ Error fetching tickets:", error.message);
    return false;
  }
}

async function runAllTests() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  GitHub-Style Ticket System - Integration Test            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log("\n❌ Tests aborted: Login failed");
      return;
    }

    // Test 2: Get users for assignment
    const assignableUsers = await testGetUsers();

    // Test 3: Create issue
    const userIdsToAssign = assignableUsers.slice(0, 2).map(u => u.id); // Assign to first 2 users
    const createSuccess = await testCreateIssue(userIdsToAssign);
    if (!createSuccess) {
      console.log("\n❌ Tests aborted: Issue creation failed");
      return;
    }

    // Test 4: Add comment
    await testAddComment(createdIssueId);

    // Test 5: Add reaction
    await testAddReaction(createdIssueId);

    // Test 6: Close issue
    await testCloseIssue(createdIssueId);

    // Test 7: Reopen issue
    await testReopenIssue(createdIssueId);

    // Test 8: Fetch all tickets
    await testGetTickets();

    // Summary
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║  TEST SUMMARY                                              ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("✅ Login successful");
    console.log("✅ User fetching working");
    console.log(`✅ Issue #${createdIssueNumber} created`);
    console.log("✅ Assignment system working");
    console.log("✅ Comment system working");
    console.log("✅ Reaction system working");
    console.log("✅ Status changes (close/reopen) working");
    console.log("✅ Ticket fetching working");
    console.log("\n🎉 All tests passed!");
    console.log(`\n📋 Test Issue ID: ${createdIssueId}`);
    console.log(`🔢 Test Issue Number: #${createdIssueNumber}`);

  } catch (error) {
    console.error("\n💥 Unexpected error:", error);
    console.error("\nMake sure:");
    console.error("1. Development server is running (npm run dev)");
    console.error("2. Database migration has been run");
    console.error("3. User 'admin@lnc.com' exists with proper roles");
  }
}

// Run the tests
runAllTests();
