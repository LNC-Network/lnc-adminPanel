import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email-service";

function envCheck() {
    return {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
}

export async function POST(req: Request) {
    const { url, key } = envCheck();
    if (!url || !key) {
        return NextResponse.json(
            { error: "Server misconfigured (missing env vars)" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json().catch(() => null);
        const email = body?.email;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // 1. Validate email domain
        if (!email.toLowerCase().endsWith("@lnc.com")) {
            return NextResponse.json(
                { error: "Email must be a valid @lnc.com address" },
                { status: 400 }
            );
        }

        const supabase = createClient(url, key);

        // 2. Check if user exists
        const { data: user, error: userErr } = await supabase
            .from("users")
            .select("id, is_active, personal_email")
            .eq("email", email)
            .maybeSingle();

        if (userErr) {
            console.error("Supabase user fetch error:", userErr);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }

        if (!user) {
            // For security, checking user existence is fine in enterprise app
            return NextResponse.json(
                { error: "No account found with this email" },
                { status: 404 }
            );
        }

        if (!user.is_active) {
            return NextResponse.json(
                { error: "Account is disabled" },
                { status: 403 }
            );
        }

        // 3. Generate 6-digit Random OTP & Expiry
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

        // 4. Store OTP in password_resets table (Associated with the Login ID/Email)
        // Remove old OTPs for this email first (avoids unique constraint issues)
        const { error: deleteErr } = await supabase
            .from("password_resets")
            .delete()
            .eq("email", email);

        if (deleteErr) {
            console.error("Error clearing old OTPs:", deleteErr);
        }

        const { error: insertErr } = await supabase
            .from("password_resets")
            .insert({
                email, // Store against the Login ID (@lnc.com) so verification works
                otp,
                expires_at: expiresAt,
                created_at: new Date().toISOString()
            });

        if (insertErr) {
            console.error("OTP storage error:", insertErr);
            if (insertErr.code === '42P01') {
                return NextResponse.json(
                    { error: "System configuration error: logic table missing. Please contact admin." },
                    { status: 500 }
                );
            }
            return NextResponse.json(
                { error: "Failed to generate OTP" },
                { status: 500 }
            );
        }

        // 5. Send Email to Personal Email ID
        // User requested to fetch mail ID from database and send on that.
        const targetEmail = user.personal_email;

        if (!targetEmail) {
            console.error("User has no personal_email:", email);
            return NextResponse.json(
                { error: "No contact email found for this account. Please contact admin." },
                { status: 400 }
            );
        }

        const emailResult = await sendPasswordResetEmail(targetEmail, otp);

        if (!emailResult.success) {
            return NextResponse.json(
                { error: "Failed to send email: " + emailResult.error },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "OTP sent successfully to your registered personal email." },
            { status: 200 }
        );

    } catch (err: any) {
        console.error("Forgot password error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

