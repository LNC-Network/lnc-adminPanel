"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import ParticleCanvas from "@/components/ParticleCanvas";

interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
}

interface Form {
    id: string;
    name: string;
    description: string;
    fields: FormField[];
    is_active?: boolean;
}

export default function PublicFormPage() {
    const { formId } = useParams();
    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (formId) {
            fetchForm(formId as string);
        }
    }, [formId]);

    const fetchForm = async (id: string) => {
        try {
            const res = await fetch(`/api/forms?formId=${id}`);
            const data = await res.json();

            if (res.ok && data.form) {
                setForm(data.form);
            } else {
                setError(data.error || "Form not found");
            }
        } catch (err) {
            setError("Failed to load form");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;

        // Validate required fields
        for (const field of form.fields) {
            if (field.required && !formData[field.id]) {
                toast.error(`${field.label} is required`);
                return;
            }
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/forms/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    formId: form.id,
                    data: formData,
                }),
            });

            const result = await res.json();

            if (res.ok) {
                setSubmitted(true);
                toast.success("Submitted successfully!");
            } else {
                toast.error(result.error || "Failed to submit");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (id: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !form) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4 sm:p-6">
                <h1 className="text-xl sm:text-2xl font-bold mb-2 text-destructive">Error</h1>
                <p className="text-sm sm:text-base text-muted-foreground">{error || "Form not found"}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full relative bg-background text-foreground overflow-x-hidden flex items-center justify-center p-2 sm:p-4 md:p-6">
            <Toaster position="top-center" richColors />

            {/* Background Particles */}
            <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
                <ParticleCanvas />
            </div>

            <div className="w-full max-w-[95%] sm:max-w-xl md:max-w-2xl relative z-10 animate-fade-in">
                <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl bg-black/70 sm:bg-black/60" style={{ WebkitBackdropFilter: 'blur(24px)', backdropFilter: 'blur(24px)' }}>

                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8 text-center">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            {form.name}
                        </h1>
                        {form.description && (
                            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">{form.description}</p>
                        )}
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                            {form.fields.map((field) => (
                                <div key={field.id} className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-medium text-gray-200">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>

                                    {field.type === "textarea" ? (
                                        <textarea
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-500 min-h-[80px] sm:min-h-[100px] resize-y"
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                        />
                                    ) : field.type === "select" ? (
                                        <select
                                            required={field.required}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-gray-200 [&>option]:bg-slate-900"
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Select an option</option>
                                            {field.options?.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : field.type === "checkbox" || field.type === "toggle" ? (
                                        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/10">
                                            <input
                                                type="checkbox"
                                                id={field.id}
                                                className="w-4 h-4 sm:w-5 sm:h-5 accent-primary rounded cursor-pointer"
                                                onChange={(e) => handleChange(field.id, e.target.checked)}
                                            />
                                            <label htmlFor={field.id} className="text-xs sm:text-sm text-gray-300 cursor-pointer select-none">
                                                {field.placeholder || "Yes"}
                                            </label>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type === "phone" ? "tel" : field.type}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-gray-500"
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 sm:py-4 mt-2 bg-primary hover:bg-primary/90 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Form"
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-8 sm:py-10 md:py-12 animate-fade-in">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-green-400 border border-green-500/30">
                                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Thank You!</h2>
                            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Your submission has been received.</p>
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setFormData({});
                                }}
                                className="px-4 sm:px-6 py-2 text-xs sm:text-sm text-white/60 hover:text-white transition-colors touch-manipulation"
                            >
                                Submit another response
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-4 sm:mt-6 md:mt-8 text-center text-[10px] sm:text-xs text-white/20">
                    Powered by LNC Forms
                </div>
            </div>
        </div>
    );
}
