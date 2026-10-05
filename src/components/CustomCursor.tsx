"use client";

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom Cursor — zero-lag, RAF-driven, no React re-renders.
 *
 * Architecture:
 *  - Uses requestAnimationFrame for buttery-smooth 60fps tracking
 *  - Direct DOM manipulation via refs (no useState for position)
 *  - Lerp interpolation for the outer ring = organic trailing feel
 *  - Inner dot follows mouse exactly = precise, responsive
 *  - Expands + adds backdrop-blur on interactive elements
 *  - Gracefully hidden on touch devices
 */
export function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const mouse = useRef({ x: -100, y: -100 });
    const ring = useRef({ x: -100, y: -100 });
    const hovering = useRef(false);
    const clicking = useRef(false);
    const visible = useRef(false);
    const rafId = useRef<number>(0);

    /** Lerp: linear interpolation for smooth trailing */
    const lerp = useCallback((a: number, b: number, t: number) => a + (b - a) * t, []);

    useEffect(() => {
        // Skip on touch devices
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouch) return;

        const dot = dotRef.current;
        const ringEl = ringRef.current;
        if (!dot || !ringEl) return;

        // ------- Event Handlers ------- //

        const onMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
            if (!visible.current) {
                visible.current = true;
                dot.style.opacity = '1';
                ringEl.style.opacity = '1';
            }
        };

        const onMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            hovering.current = !!target.closest(
                'a, button, [role="button"], input, textarea, select, label[for], .cursor-expand'
            );
        };

        const onMouseDown = () => { clicking.current = true; };
        const onMouseUp = () => { clicking.current = false; };

        const onMouseLeave = () => {
            visible.current = false;
            dot.style.opacity = '0';
            ringEl.style.opacity = '0';
        };

        const onMouseEnter = () => {
            visible.current = true;
            dot.style.opacity = '1';
            ringEl.style.opacity = '1';
        };

        // ------- Animation Loop ------- //

        const tick = () => {
            // Dot: follows mouse exactly (no lag)
            dot.style.transform = `translate3d(${mouse.current.x - 4}px, ${mouse.current.y - 4}px, 0) scale(${
                clicking.current ? 0.6 : hovering.current ? 0 : 1
            })`;

            // Ring: lerp for smooth trailing effect
            ring.current.x = lerp(ring.current.x, mouse.current.x, 0.15);
            ring.current.y = lerp(ring.current.y, mouse.current.y, 0.15);

            const ringSize = hovering.current ? 60 : 40;
            const ringOffset = ringSize / 2;

            ringEl.style.width = `${ringSize}px`;
            ringEl.style.height = `${ringSize}px`;
            ringEl.style.transform = `translate3d(${ring.current.x - ringOffset}px, ${ring.current.y - ringOffset}px, 0) scale(${
                clicking.current ? 0.85 : 1
            })`;
            ringEl.style.borderColor = hovering.current
                ? 'rgba(200, 170, 110, 0.8)'
                : 'rgba(200, 170, 110, 0.35)';
            ringEl.style.backdropFilter = hovering.current ? 'blur(4px)' : 'none';
            ringEl.style.background = hovering.current
                ? 'rgba(200, 170, 110, 0.06)'
                : 'transparent';

            rafId.current = requestAnimationFrame(tick);
        };

        // ------- Bind & Start ------- //

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mouseover', onMouseOver, { passive: true });
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mouseleave', onMouseLeave);
        document.addEventListener('mouseenter', onMouseEnter);
        rafId.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseover', onMouseOver);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mouseleave', onMouseLeave);
            document.removeEventListener('mouseenter', onMouseEnter);
            cancelAnimationFrame(rafId.current);
        };
    }, [lerp]);

    return (
        <>
            {/* Hide system cursor on desktop */}
            <style>{`
                @media (hover: hover) and (pointer: fine) {
                    * { cursor: none !important; }
                }
            `}</style>

            {/* Dot — precise, immediate */}
            <div
                ref={dotRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-accent, #c8aa6e)',
                    pointerEvents: 'none',
                    zIndex: 99999,
                    mixBlendMode: 'difference',
                    opacity: 0,
                    willChange: 'transform',
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Ring — smooth trailing */}
            <div
                ref={ringRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(200, 170, 110, 0.35)',
                    background: 'transparent',
                    pointerEvents: 'none',
                    zIndex: 99998,
                    mixBlendMode: 'difference',
                    opacity: 0,
                    willChange: 'transform, width, height',
                    transition: 'opacity 0.3s ease, width 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.3s ease, background 0.3s ease, backdrop-filter 0.3s ease',
                }}
            />
        </>
    );
}
