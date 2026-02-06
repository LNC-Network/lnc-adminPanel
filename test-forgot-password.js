/**
 * Forgot Password Flow Test Script
 * 
 * This script tests the complete forgot password flow:
 * 1. Request OTP for email
 * 2. Wait for user to provide OTP from email
 * 3. Reset password using OTP
 */

const API_BASE = "http://localhost:3000";
const TEST_EMAIL = "example@lnc.com";
const NEW_PASSWORD = "ExampleTest";

async function testForgotPassword() {
    console.log("🧪 Testing Forgot Password Flow\n");
    console.log("=".repeat(60));

    // Step 1: Request OTP
    console.log("\n📧 Step 1: Requesting OTP for", TEST_EMAIL);
    console.log("-".repeat(60));

    try {
        const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: TEST_EMAIL }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Failed to send OTP:", data.error);
            console.log("\nStatus:", response.status);
            console.log("Response:", JSON.stringify(data, null, 2));
            process.exit(1);
        }

        console.log("✅ OTP Request Successful!");
        console.log("Response:", data.message);
        console.log("\n📬 Please check your email at:", TEST_EMAIL);
        console.log("⏱️  OTP is valid for 15 minutes");

    } catch (error) {
        console.error("❌ Network error:", error.message);
        process.exit(1);
    }

    console.log("\n" + "=".repeat(60));
    console.log("⏸️  PAUSED - Waiting for OTP from user...");
    console.log("=".repeat(60));
}

async function testResetPassword(otp) {
    console.log("\n🔑 Step 2: Resetting Password with OTP");
    console.log("-".repeat(60));

    try {
        const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: TEST_EMAIL,
                otp: otp,
                password: NEW_PASSWORD,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Failed to reset password:", data.error);
            console.log("\nStatus:", response.status);
            console.log("Response:", JSON.stringify(data, null, 2));
            process.exit(1);
        }

        console.log("✅ Password Reset Successful!");
        console.log("Response:", data.message);
        console.log("\n🎉 Test Complete!");
        console.log("New password:", NEW_PASSWORD);
        console.log("\n" + "=".repeat(60));

    } catch (error) {
        console.error("❌ Network error:", error.message);
        process.exit(1);
    }
}

// Check if OTP is provided as command-line argument
const otp = process.argv[2];

if (!otp) {
    // Step 1: Request OTP
    testForgotPassword();
    console.log("\n💡 After receiving OTP, run:");
    console.log(`   bun test-forgot-password.js <YOUR_OTP>`);
} else {
    // Step 2: Reset password with OTP
    console.log("🧪 Testing Password Reset with OTP\n");
    console.log("=".repeat(60));
    testResetPassword(otp);
}
