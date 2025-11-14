// Test script to check Supabase connection and user
// Run this in your browser console on the login page

const testSupabaseAuth = async () => {
  const email = "YOUR_EMAIL_HERE"; // Replace with the email you're trying to log in with
  const password = "YOUR_PASSWORD_HERE"; // Replace with your password
  
  console.log("Testing Supabase Auth...");
  console.log("Email:", email);
  
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    console.log("Status:", response.status);
    console.log("Response:", data);
    
    if (response.status === 401) {
      console.error("❌ 401 Error - Possible reasons:");
      console.error("1. User doesn't exist in Supabase Auth");
      console.error("2. Wrong password");
      console.error("3. Email not confirmed (if email confirmation is enabled)");
    }
    
    if (response.status === 403) {
      console.error("❌ 403 Error - User exists but lacks admin/editor role");
      console.error("Fix: Add role to user_metadata in Supabase Dashboard");
    }
    
  } catch (error) {
    console.error("Network error:", error);
  }
};

// Call the function
testSupabaseAuth();
