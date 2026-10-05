"use client";

import { useEffect, useRef, useCallback } from 'react';

/**
 * HeroBackground — Professional animated canvas background.
 *
 * Creates a flowing network of interconnected nodes that evokes
 * ambition, growth, and professional connectivity.
 *
 * Features:
 *  - Floating luminous particles with gentle drift
 *  - Dynamic connection lines between nearby nodes (network graph)
 *  - Warm gold accent color pulse on select nodes
 *  - Subtle mouse-reactive parallax (particles drift toward cursor)
 *  - Radial glow hotspot that follows the viewport center
 *  - Fully GPU-composited via canvas + requestAnimationFrame
 *  - Responsive: resizes on window resize
 */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
    isAccent: boolean;
    pulsePhase: number;
    pulseSpeed: number;
}

const PARTICLE_COUNT = 80;
const CONNECTION_DISTANCE = 160;
const MOUSE_INFLUENCE_RADIUS = 300;
const MOUSE_FORCE = 0.015;

export function HeroBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const mouse = useRef({ x: -1000, y: -1000 });
    const dimensions = useRef({ w: 0, h: 0 });
    const rafId = useRef<number>(0);
    const time = useRef(0);

    /** Create particles spread across the canvas */
    const initParticles = useCallback((w: number, h: number) => {
        const arr: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            arr.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                isAccent: Math.random() < 0.2, // 20% are gold accent
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.02 + 0.01,
            });
        }
        particles.current = arr;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        /** Resize handler */
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            dimensions.current.w = rect.width;
            dimensions.current.h = rect.height;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            if (particles.current.length === 0) {
                initParticles(rect.width, rect.height);
            }
        };

        /** Mouse tracking */
        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.current.x = e.clientX - rect.left;
            mouse.current.y = e.clientY - rect.top;
        };

        const onMouseLeave = () => {
            mouse.current.x = -1000;
            mouse.current.y = -1000;
        };

        /** Main render loop */
        const render = () => {
            const { w, h } = dimensions.current;
            const pts = particles.current;
            time.current += 1;

            ctx.clearRect(0, 0, w, h);

            // --- Radial glow hotspot (center of canvas, slow drift) ---
            const glowX = w * 0.35 + Math.sin(time.current * 0.003) * 80;
            const glowY = h * 0.5 + Math.cos(time.current * 0.004) * 60;
            const glowGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 350);
            glowGrad.addColorStop(0, 'rgba(201, 168, 76, 0.06)');
            glowGrad.addColorStop(0.5, 'rgba(201, 168, 76, 0.02)');
            glowGrad.addColorStop(1, 'rgba(201, 168, 76, 0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, w, h);

            // --- Update particle positions ---
            for (const p of pts) {
                // Mouse attraction (subtle parallax pull)
                const dx = mouse.current.x - p.x;
                const dy = mouse.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_INFLUENCE_RADIUS && dist > 0) {
                    const force = (1 - dist / MOUSE_INFLUENCE_RADIUS) * MOUSE_FORCE;
                    p.vx += dx * force * 0.01;
                    p.vy += dy * force * 0.01;
                }

                // Apply velocity with gentle friction
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.995;
                p.vy *= 0.995;

                // Wrap around edges with padding
                if (p.x < -20) p.x = w + 20;
                if (p.x > w + 20) p.x = -20;
                if (p.y < -20) p.y = h + 20;
                if (p.y > h + 20) p.y = -20;

                // Pulse animation
                p.pulsePhase += p.pulseSpeed;
            }

            // --- Draw connection lines ---
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONNECTION_DISTANCE) {
                        const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.15;
                        const isAccentLine = pts[i].isAccent || pts[j].isAccent;

                        ctx.beginPath();
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.strokeStyle = isAccentLine
                            ? `rgba(201, 168, 76, ${alpha * 1.2})`
                            : `rgba(250, 248, 245, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // --- Draw particles ---
            for (const p of pts) {
                const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
                const alpha = p.opacity * pulse;
                const r = p.radius * (0.8 + pulse * 0.4);

                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);

                if (p.isAccent) {
                    // Gold glow particles
                    ctx.fillStyle = `rgba(201, 168, 76, ${alpha})`;
                    ctx.shadowColor = 'rgba(201, 168, 76, 0.4)';
                    ctx.shadowBlur = 12;
                } else {
                    // White/silver particles
                    ctx.fillStyle = `rgba(250, 248, 245, ${alpha * 0.7})`;
                    ctx.shadowColor = 'rgba(250, 248, 245, 0.15)';
                    ctx.shadowBlur = 6;
                }

                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // --- Floating horizontal scan line (very subtle) ---
            const scanY = ((time.current * 0.3) % (h + 40)) - 20;
            const scanGrad = ctx.createLinearGradient(0, scanY, 0, scanY + 2);
            scanGrad.addColorStop(0, 'rgba(201, 168, 76, 0)');
            scanGrad.addColorStop(0.5, 'rgba(201, 168, 76, 0.03)');
            scanGrad.addColorStop(1, 'rgba(201, 168, 76, 0)');
            ctx.fillStyle = scanGrad;
            ctx.fillRect(0, scanY, w, 2);

            rafId.current = requestAnimationFrame(render);
        };

        // --- Bind events & start ---
        resize();
        window.addEventListener('resize', resize);
        canvas.addEventListener('mousemove', onMouseMove, { passive: true });
        canvas.addEventListener('mouseleave', onMouseLeave);
        rafId.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mouseleave', onMouseLeave);
            cancelAnimationFrame(rafId.current);
        };
    }, [initParticles]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                zIndex: 1,
            }}
        />
    );
}
