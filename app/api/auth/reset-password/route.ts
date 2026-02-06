import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import argon2 from "argon2";

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
            { error: "Server misconfigured" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json().catch(() => null);
        const { email, otp, password } = body || {};

        if (!email || !otp || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = createClient(url, key);

        // 1. Verify OTP from password_resets
        const { data: resetRecord, error: fetchErr } = await supabase
            .from("password_resets")
            .select("*")
            .eq("email", email)
            .eq("otp", otp)
            .maybeSingle();

        if (fetchErr) {
            console.error("OTP verify error:", fetchErr);
            return NextResponse.json(
                { error: "Internal error verifying OTP" },
                { status: 500 }
            );
        }

        if (!resetRecord) {
            return NextResponse.json(
                { error: "Invalid OTP" },
                { status: 400 }
            );
        }

        // Check expiry
        if (new Date(resetRecord.expires_at) < new Date()) {
            return NextResponse.json(
                { error: "OTP has expired" },
                { status: 400 }
            );
        }

        // 2. Fetch User Details (to get personal_email)
        const { data: user, error: userErr } = await supabase
            .from("users")
            .select("personal_email")
            .eq("email", email)
            .single();

        if (userErr || !user) {
            console.error("User fetch error during reset:", userErr);
            // Proceed with reset even if fetch fails, but log it.
        }

        // 3. Hash New Password
        const passwordHash = await argon2.hash(password);

        // 4. Update User Password
        const { error: updateErr } = await supabase
            .from("users")
            .update({ password_hash: passwordHash })
            .eq("email", email);

        if (updateErr) {
            console.error("Password update error:", updateErr);
            return NextResponse.json(
                { error: "Failed to update password" },
                { status: 500 }
            );
        }

        // 5. Delete Used OTP
        await supabase
            .from("password_resets")
            .delete()
            .eq("email", email);

        // 6. Send Confirmation Email
        if (user?.personal_email) {
            // Dynamically import to avoid circular dependencies if any (though unlikely here)
            const { sendPasswordChangedEmail } = await import("@/lib/email-service");
            await sendPasswordChangedEmail(user.personal_email);
        }

        return NextResponse.json(
            { message: "Password updated successfully" },
            { status: 200 }
        );

    } catch (err: any) {
        console.error("Reset password error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
