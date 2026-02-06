"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';

// Particle class for the animation
class Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    vx: number = 0;
    vy: number = 0;
    radius: number;
    color: string;

    constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.radius = radius;
        this.color = color;
    }

    // Update particle position with spring physics
    update(mouseX: number | null, mouseY: number | null, repelRadius: number) {
        // Mouse repulsion (anti-gravity effect)
        if (mouseX !== null && mouseY !== null) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < repelRadius) {
                const force = (repelRadius - distance) / repelRadius;
                const angle = Math.atan2(dy, dx);
                this.vx += Math.cos(angle) * force * 2;
                this.vy += Math.sin(angle) * force * 2;
            }
        }

        // Spring force to return to target position
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        // Spring physics
        const springStrength = 0.01;
        const damping = 0.9;

        this.vx += dx * springStrength;
        this.vy += dy * springStrength;
        this.vx *= damping;
        this.vy *= damping;

        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

export default function LoginParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
    const animationFrameRef = useRef<number>();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Initialize particles in "LOGO" text formation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            // Reinitialize particles when canvas size changes
            initParticles();
        };

        const initParticles = () => {
            const particles: Particle[] = [];
            const rect = canvas.getBoundingClientRect();

            // Create temporary canvas for logo rendering
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            // Use integer dimensions for proper pixel sampling
            const canvasWidth = Math.floor(rect.width);
            const canvasHeight = Math.floor(rect.height);

            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;

            // Load and render the logo SVG
            const img = new Image();
            img.onload = () => {
                // Calculate logo size (maintain aspect ratio)
                const logoSize = Math.min(canvasWidth * 0.4, canvasHeight * 0.4, 250);
                const logoX = (canvasWidth - logoSize) / 2;
                const logoY = (canvasHeight - logoSize) / 2;

                // Clear and draw the logo
                tempCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                tempCtx.drawImage(img, logoX, logoY, logoSize, logoSize);

                // Sample pixels from the logo to create particles
                const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
                const pixels = imageData.data;

                // Sampling density - adjust for performance
                const gap = 3; // Smaller gap = more particles (reduced for denser logo)

                for (let y = 0; y < canvasHeight; y += gap) {
                    for (let x = 0; x < canvasWidth; x += gap) {
                        const index = (y * canvasWidth + x) * 4;
                        const alpha = pixels[index + 3];

                        // If pixel is part of the logo (not transparent)
                        if (alpha > 128) {
                            // Random offset for organic feel
                            const offsetX = (Math.random() - 0.5) * 2;
                            const offsetY = (Math.random() - 0.5) * 2;

                            // Gradient colors from blue to purple matching logo
                            const hue = 200 + Math.random() * 80; // Blue to purple range
                            const saturation = 70 + Math.random() * 30;
                            const lightness = 50 + Math.random() * 20;
                            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                            particles.push(
                                new Particle(
                                    x + offsetX + Math.random() * 100 - 50,
                                    y + offsetY + Math.random() * 100 - 50,
                                    1.5 + Math.random() * 1.5,
                                    color
                                )
                            );
                        }
                    }
                }

                particlesRef.current = particles;
                console.log(`Initialized ${particles.length} particles from logo`);
            };

            img.onerror = () => {
                console.error('Failed to load logo, falling back to text');
                // Fallback to text if image fails to load
                const fontSize = Math.min(canvasWidth * 0.25, 120);
                tempCtx.font = `bold ${fontSize}px Arial`;
                tempCtx.fillStyle = 'white';
                tempCtx.textAlign = 'center';
                tempCtx.textBaseline = 'middle';
                tempCtx.fillText('LNC', canvasWidth / 2, canvasHeight / 2);

                const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
                const pixels = imageData.data;
                const gap = 4;

                for (let y = 0; y < canvasHeight; y += gap) {
                    for (let x = 0; x < canvasWidth; x += gap) {
                        const index = (y * canvasWidth + x) * 4;
                        const alpha = pixels[index + 3];
                        if (alpha > 128) {
                            const offsetX = (Math.random() - 0.5) * 4;
                            const offsetY = (Math.random() - 0.5) * 4;
                            const hue = 200 + Math.random() * 80;
                            const saturation = 70 + Math.random() * 30;
                            const lightness = 50 + Math.random() * 20;
                            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                            particles.push(
                                new Particle(
                                    x + offsetX,
                                    y + offsetY,
                                    1.5 + Math.random() * 1.5,
                                    color
                                )
                            );
                        }
                    }
                }
                particlesRef.current = particles;
                console.log(`Initialized ${particles.length} particles from fallback text`);
            };

            // Load the logo image
            img.src = '/lnc-adminPanel/public/android-chrome-192x192.png';
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        // Animation loop
        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            const { x: mouseX, y: mouseY } = mouseRef.current;
            const repelRadius = 150;

            particlesRef.current.forEach(particle => {
                particle.update(mouseX, mouseY, repelRadius);
                particle.draw(ctx);
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Mouse move handler
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseLeave = () => {
        mouseRef.current = { x: null, y: null };
    };

    // Login handler
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please enter email and password');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Invalid credentials');
                setIsLoading(false);
                return;
            }

            // Store the access token
            Cookies.set('access_token', data.access_token, {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: 0.5, // 12 hours
            });

            // Store user in localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            toast.success(`Welcome back, ${data.user.email}`);
            router.push('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            toast.error('Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <>
            <Toaster closeButton richColors position="bottom-right" theme="dark" />

            <div className="flex min-h-screen w-full bg-black overflow-hidden">
                {/* Left Side - Particle Animation */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
                    <canvas
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="w-full h-full cursor-pointer"
                        style={{ display: 'block' }}
                    />

                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 pointer-events-none" />

                    {/* Floating instruction text */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <p className="text-sm text-white/40 font-light">
                            Hover to interact with the particles
                        </p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 bg-black relative">
                    {/* Background gradient effects */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    <div className="w-full max-w-md relative z-10">
                        <div className="backdrop-blur-2xl bg-white/5 p-8 lg:p-10 rounded-2xl border border-white/10 shadow-2xl">
                            {/* Header */}
                            <div className="flex flex-col items-center gap-2 mb-8 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white mb-4 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                    Welcome Back
                                </h1>
                                <p className="text-sm text-white/50">
                                    Enter your credentials to access the admin panel
                                </p>
                            </div>

                            {/* Login Form */}
                            <form onSubmit={handleLogin} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-white/80">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-black/40 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 text-white placeholder:text-white/30 transition-all h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-white/80">
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-black/40 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 text-white placeholder:text-white/30 transition-all h-11"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Footer */}
                            <div className="mt-6 text-center text-sm">
                                <p className="text-white/40">
                                    Protected by LNC Network Security
                                </p>
                            </div>
                        </div>

                        {/* Mobile particle hint */}
                        <div className="lg:hidden mt-6 text-center">
                            <p className="text-xs text-white/30">
                                View on desktop for interactive particle effects
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
