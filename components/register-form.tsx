"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ArrowLeft, Mail, Lock, User, Users } from "lucide-react";
import { toast } from "sonner";

interface RegisterFormProps {
    onBack: () => void;
}

export default function RegisterForm({ onBack }: RegisterFormProps) {
    const [formData, setFormData] = useState({
        display_name: "",
        email: "",
        personal_email: "",
        password: "",
        confirmPassword: "",
        team: "",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.display_name || !formData.email || !formData.personal_email || !formData.password || !formData.team) {
            toast.error("Please fill in all fields");
            return;
        }

        if (!formData.email.endsWith("@lnc.com")) {
            toast.error("Email must be from @lnc.com domain");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    display_name: formData.display_name,
                    email: formData.email,
                    personal_email: formData.personal_email,
                    password: formData.password,
                    team: formData.team,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || "Registration submitted successfully!");
                // Reset form
                setFormData({
                    display_name: "",
                    email: "",
                    personal_email: "",
                    password: "",
                    confirmPassword: "",
                    team: "",
                });
                // Go back to login after 2 seconds
                setTimeout(() => {
                    onBack();
                }, 2000);
            } else {
                toast.error(data.error || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error);
            toast.error("Failed to submit registration");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Login
                    </Button>
                </div>
                <CardTitle className="text-2xl font-bold">New User Registration</CardTitle>
                <CardDescription>
                    Submit your registration request. An admin will review and approve your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="display_name">
                            <User className="inline h-4 w-4 mr-1" />
                            Full Name
                        </Label>
                        <Input
                            id="display_name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.display_name}
                            onChange={(e) =>
                                setFormData({ ...formData, display_name: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">
                            <Mail className="inline h-4 w-4 mr-1" />
                            Email (@lnc.com)
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="yourname@lnc.com"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Must use your @lnc.com email address
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="personal_email">
                            <Mail className="inline h-4 w-4 mr-1" />
                            Personal Email
                        </Label>
                        <Input
                            id="personal_email"
                            type="email"
                            placeholder="yourname@gmail.com"
                            value={formData.personal_email}
                            onChange={(e) =>
                                setFormData({ ...formData, personal_email: e.target.value })
                            }
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            We'll send notifications to this email address
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="team">
                            <Users className="inline h-4 w-4 mr-1" />
                            Team/Department
                        </Label>
                        <Select
                            value={formData.team}
                            onValueChange={(value) =>
                                setFormData({ ...formData, team: value })
                            }
                        >
                            <SelectTrigger id="team">
                                <SelectValue placeholder="Select your team" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Development">Development</SelectItem>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Sales">Sales</SelectItem>
                                <SelectItem value="Support">Support</SelectItem>
                                <SelectItem value="Operations">Operations</SelectItem>
                                <SelectItem value="HR">Human Resources</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            <Lock className="inline h-4 w-4 mr-1" />
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            At least 6 characters
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                            <Lock className="inline h-4 w-4 mr-1" />
                            Confirm Password
                        </Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            "Submitting..."
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Submit Registration
                            </>
                        )}
                    </Button>

                    <div className="text-sm text-muted-foreground text-center">
                        Your request will be reviewed by an admin. You'll be able to login once approved.
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
