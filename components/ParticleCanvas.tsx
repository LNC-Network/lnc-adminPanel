"use client";

import { useEffect, useRef } from "react";

// Particle class
class Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    vx: number;
    vy: number;
    size: number;
    color: string;

    constructor(targetX: number, targetY: number, size: number, color: string) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = targetX;
        this.y = targetY;
        this.vx = 0;
        this.vy = 0;
        this.size = size;
        this.color = color;
    }

    update(mouseX: number | null, mouseY: number | null, repelRadius: number) {
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

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

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
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
    const animationFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        const initParticles = () => {
            const particles: Particle[] = [];
            const rect = canvas.getBoundingClientRect();

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            const canvasWidth = Math.floor(rect.width);
            const canvasHeight = Math.floor(rect.height);

            // Guard against zero dimensions
            if (canvasWidth === 0 || canvasHeight === 0) {
                console.log('Canvas dimensions not ready, retrying...');
                setTimeout(initParticles, 100);
                return;
            }

            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;

            const img = new Image();
            img.onload = () => {
                const logoSize = Math.min(canvasWidth * 0.7, canvasHeight * 0.7, 250);
                const logoX = (canvasWidth - logoSize) / 2;
                const logoY = (canvasHeight - logoSize) / 2;

                tempCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                tempCtx.drawImage(img, logoX, logoY, logoSize, logoSize);

                const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
                const pixels = imageData.data;
                const gap = 3;

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
                console.log(`Initialized ${particles.length} particles from logo`);
            };

            img.onerror = () => {
                console.error('Failed to load logo, falling back to text');
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

            img.src = '/android-chrome-192x192.png';
        };

        updateCanvasSize();
        initParticles();

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: null, y: null };
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        const handleResize = () => {
            updateCanvasSize();
            initParticles();
        };
        window.addEventListener("resize", handleResize);

        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            const repelRadius = 80;
            particlesRef.current.forEach((particle) => {
                particle.update(mouseRef.current.x, mouseRef.current.y, repelRadius);
                particle.draw(ctx);
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-auto"
            style={{ zIndex: 0 }}
        />
    );
}
