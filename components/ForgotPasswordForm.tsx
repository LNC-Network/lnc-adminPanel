"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, KeyRound, Mail } from "lucide-react";

interface ForgotPasswordFormProps {
    onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Request OTP
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        if (!email.toLowerCase().endsWith("@lnc.com")) {
            toast.error("Please enter a valid @lnc.com email address");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to send OTP");
            }

            toast.success("OTP sent to your email!");
            setStep(2);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || !password || !confirmPassword) {
            toast.error("All fields are required");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to reset password");
            }

            toast.success("Password reset successfully! Please login.");
            onBack(); // Return to login
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-fade-in w-full">
            {step === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reset-email">Work Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="name@lnc.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9 bg-black/20 border-white/10"
                                required
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter your existing @lnc.com email address to receive a One-Time Password.
                        </p>
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Send OTP"}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                            id="otp"
                            placeholder="6-digit code"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="bg-black/20 border-white/10 tracking-widest text-center text-lg font-mono"
                            maxLength={6}
                            required
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-pass">New Password</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="new-pass"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9 bg-black/20 border-white/10"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-pass">Confirm Password</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirm-pass"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-9 bg-black/20 border-white/10"
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Reset Password"}
                    </Button>
                </form>
            )}

            <div className="text-center pt-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </button>
            </div>
        </div>
    );
}
