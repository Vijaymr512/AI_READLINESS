import { useEffect, useRef } from 'react';

export default function AmbientMesh() {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas.getContext('2d');
        let animId, t = 0;
        let mouse = { x: -999, y: -999 };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

        const N = 65;
        const particles = Array.from({ length: N }, (_, i) => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.28,
            vy: (Math.random() - 0.5) * 0.28,
            r: Math.random() * 1.5 + 0.5,
            hue: [190, 200, 270, 55, 10][i % 5],
            alpha: Math.random() * 0.5 + 0.3,
        }));

        const bubbles = [
            { rx: 0.18, ry: 0.15, color: 'rgba(0,212,255,', a: 0.1, size: 0.4 },
            { rx: 0.85, ry: 0.80, color: 'rgba(157,78,237,', a: 0.08, size: 0.35 },
            { rx: 0.88, ry: 0.12, color: 'rgba(255,215,0,', a: 0.06, size: 0.28 },
            { rx: 0.12, ry: 0.85, color: 'rgba(0,255,157,', a: 0.06, size: 0.22 },
        ];

        let scanY = 0;

        const draw = () => {
            const W = canvas.width, H = canvas.height;
            t += 0.004;
            ctx.clearRect(0, 0, W, H);

            const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.85);
            bg.addColorStop(0, '#050d1e');
            bg.addColorStop(1, '#020714');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            bubbles.forEach(b => {
                const alpha = b.a + Math.sin(t) * 0.02;
                const g = ctx.createRadialGradient(b.rx * W, b.ry * H, 0, b.rx * W, b.ry * H, b.size * W);
                g.addColorStop(0, b.color + alpha + ')');
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);
            });

            const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
            mg.addColorStop(0, 'rgba(0,212,255,0.05)');
            mg.addColorStop(1, 'transparent');
            ctx.fillStyle = mg;
            ctx.fillRect(0, 0, W, H);

            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;

                const pr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                pr.addColorStop(0, `hsla(${p.hue},90%,70%,${p.alpha})`);
                pr.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                ctx.fillStyle = pr;
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x, dy = p.y - q.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 130) {
                        const a = (1 - d / 130) * 0.1;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `hsla(${(p.hue + q.hue) / 2},80%,65%,${a})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            });

            scanY = (scanY + 0.4) % H;
            const sl = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
            sl.addColorStop(0, 'transparent');
            sl.addColorStop(0.5, 'rgba(0,212,255,0.06)');
            sl.addColorStop(1, 'transparent');
            ctx.fillStyle = sl;
            ctx.fillRect(0, scanY - 20, W, 40);

            const cx = 0, cy = 0;
            for (let r = 120; r <= 340; r += 55) {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 0.45);
                ctx.strokeStyle = `rgba(0,212,255,${0.04 + (r % 2 === 0 ? 0.02 : 0)})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            for (let r = 100; r <= 280; r += 55) {
                ctx.beginPath();
                ctx.arc(W, H, r, Math.PI, Math.PI * 1.45);
                ctx.strokeStyle = `rgba(157,78,237,0.04)`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);

    return <canvas ref={ref} id="ambient-canvas" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
