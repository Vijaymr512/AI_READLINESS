import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function playEngineStart() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.2);
        masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        masterGain.connect(ctx.destination);

        const rumble = ctx.createOscillator();
        rumble.type = 'sawtooth';
        rumble.frequency.setValueAtTime(40, ctx.currentTime);
        rumble.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.8);
        const rumbleGain = ctx.createGain();
        rumbleGain.gain.value = 0.4;
        rumble.connect(rumbleGain); rumbleGain.connect(masterGain);
        rumble.start(ctx.currentTime); rumble.stop(ctx.currentTime + 2.5);

        [220, 330, 440].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
            g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.2);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
            osc.connect(g); g.connect(masterGain);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + 2.5);
        });

        const ping = ctx.createOscillator();
        ping.type = 'triangle';
        ping.frequency.setValueAtTime(880, ctx.currentTime + 0.4);
        ping.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.9);
        const pingGain = ctx.createGain();
        pingGain.gain.setValueAtTime(0, ctx.currentTime + 0.4);
        pingGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
        pingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        ping.connect(pingGain); pingGain.connect(masterGain);
        ping.start(ctx.currentTime + 0.4); ping.stop(ctx.currentTime + 2);
    } catch (_) { }
}

function ParticleCanvas({ firing }) {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const rafRef = useRef(null);
    const firingRef = useRef(firing);
    firingRef.current = firing;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;

        const spawnParticle = (burst = false) => ({
            x: cx + (Math.random() - 0.5) * (burst ? 40 : 260),
            y: cy + (Math.random() - 0.5) * (burst ? 40 : 260),
            vx: (Math.random() - 0.5) * (burst ? 18 : 1.2),
            vy: (Math.random() - 0.5) * (burst ? 18 : 1.2),
            life: 1,
            decay: burst ? 0.02 + Math.random() * 0.03 : 0.004 + Math.random() * 0.006,
            r: burst ? 2 + Math.random() * 4 : 1 + Math.random() * 2,
            hue: burst ? Math.random() * 60 + 180 : 185 + Math.random() * 40,
        });

        for (let i = 0; i < 80; i++) particles.current.push(spawnParticle(false));

        const animate = () => {
            ctx.clearRect(0, 0, W, H);

            if (firingRef.current) {
                for (let i = 0; i < 12; i++) particles.current.push(spawnParticle(true));
            } else if (particles.current.length < 80) {
                particles.current.push(spawnParticle(false));
            }

            particles.current = particles.current.filter(p => p.life > 0);
            particles.current.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.life -= p.decay;
                const a = Math.max(0, p.life);
                ctx.save();
                ctx.globalAlpha = a * 0.85;
                ctx.shadowColor = `hsla(${p.hue},100%,65%,1)`;
                ctx.shadowBlur = 14;
                ctx.fillStyle = `hsla(${p.hue},100%,70%,1)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            rafRef.current = requestAnimationFrame(animate);
        };
        animate();
        return () => {
            cancelAnimationFrame(rafRef.current);
            particles.current = [];
        };
    }, []);

    return (
        <canvas ref={canvasRef} style={{
            position: 'fixed', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 0,
        }} />
    );
}

function EngineButton({ onClick, phase }) {
    const [hover, setHover] = useState(false);
    const [press, setPress] = useState(false);

    const handleClick = () => {
        setPress(true);
        onClick();
    };

    const rings = [
        { rx: '72deg', ry: '0deg', speed: 6, r: 1, opacity: 0.55, color: '#00d4ff' },
        { rx: '0deg', ry: '72deg', speed: 9, r: 0.9, opacity: 0.45, color: '#5AC8FA' },
        { rx: '36deg', ry: '36deg', speed: 12, r: 0.78, opacity: 0.35, color: '#9d4edd' },
        { rx: '110deg', ry: '-30deg', speed: 16, r: 0.62, opacity: 0.3, color: '#FFD700' },
        { rx: '-20deg', ry: '90deg', speed: 5, r: 0.48, opacity: 0.25, color: '#30D5C8' },
    ];

    const SIZE = 180;

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

            { }
            <motion.div style={{
                position: 'absolute', width: SIZE * 2.2, height: SIZE * 2.2,
                borderRadius: '50%', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
            }}
                animate={{ scale: hover ? [1, 1.08, 1] : 1, opacity: hover ? 1 : 0.6 }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            { }
            <div style={{ position: 'relative', width: SIZE, height: SIZE, perspective: 600 }}>

                { }
                {rings.map((ring, i) => (
                    <motion.div key={i} style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        border: `1.5px solid ${ring.color}`,
                        opacity: ring.opacity,
                        transform: `scale(${ring.r}) rotateX(${ring.rx}) rotateY(${ring.ry})`,
                        boxShadow: `0 0 8px ${ring.color}, inset 0 0 8px ${ring.color}22`,
                    }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: ring.speed, repeat: Infinity, ease: 'linear' }}
                    />
                ))}

                { }
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    viewBox="0 0 180 180">
                    {Array.from({ length: 32 }).map((_, i) => {
                        const a = (i / 32) * Math.PI * 2 - Math.PI / 2;
                        const r1 = 82, r2 = 88 + (i % 4 === 0 ? 5 : 0);
                        return (
                            <line key={i}
                                x1={90 + Math.cos(a) * r1} y1={90 + Math.sin(a) * r1}
                                x2={90 + Math.cos(a) * r2} y2={90 + Math.sin(a) * r2}
                                stroke={i % 4 === 0 ? 'rgba(0,212,255,0.7)' : 'rgba(0,212,255,0.25)'}
                                strokeWidth={i % 4 === 0 ? 2 : 1}
                            />
                        );
                    })}
                    { }
                    <circle cx="90" cy="90" r="86"
                        fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="1.5"
                        strokeDasharray="4 2"
                    />
                </svg>

                { }
                <svg style={{ position: 'absolute', inset: -22, width: 'calc(100% + 44px)', height: 'calc(100% + 44px)' }}
                    viewBox="0 0 224 224">
                    <defs>
                        <path id="topArc" d="M 20,112 A 92,92 0 0,1 204,112" />
                        <path id="botArc" d="M 20,112 A 92,92 0 0,0 204,112" />
                    </defs>
                    <text style={{ fontSize: 9, letterSpacing: '0.22em', fill: 'rgba(0,212,255,0.5)', fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>
                        <textPath href="#topArc" startOffset="8%">APP READER · AI READINESS ENGINE · v2.0</textPath>
                    </text>
                    <text style={{ fontSize: 9, letterSpacing: '0.22em', fill: 'rgba(0,212,255,0.35)', fontFamily: 'Orbitron, monospace' }}>
                        <textPath href="#botArc" startOffset="12%">POWERED BY JARVIS ANALYSIS CORE · 56 RULES</textPath>
                    </text>
                </svg>

                { }
                <motion.button
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    onClick={handleClick}
                    style={{
                        position: 'absolute', inset: 20,
                        borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: press
                            ? 'radial-gradient(circle at 40% 35%, #ffffff, #00d4ff 40%, #001a2e)'
                            : hover
                                ? 'radial-gradient(circle at 40% 35%, rgba(200,245,255,0.95), #00b4d8 35%, #001428 70%, #020714)'
                                : 'radial-gradient(circle at 40% 35%, rgba(180,240,255,0.9), #0090b8 35%, #000f1e 70%, #020714)',
                        boxShadow: hover
                            ? '0 0 60px rgba(0,212,255,0.9), 0 0 120px rgba(0,212,255,0.4), inset 0 0 30px rgba(0,212,255,0.3)'
                            : '0 0 30px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.15), inset 0 0 15px rgba(0,212,255,0.1)',
                        transition: 'all 0.3s ease',
                    }}
                    animate={press ? { scale: 0.88 } : hover ? { scale: 1.06 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                    { }
                    {[0.72, 0.52, 0.34].map((r, i) => (
                        <div key={i} style={{
                            position: 'absolute', top: '50%', left: '50%',
                            width: `${r * 100}%`, height: `${r * 100}%`,
                            marginLeft: `-${r * 50}%`, marginTop: `-${r * 50}%`,
                            borderRadius: '50%',
                            border: `1px solid rgba(255,255,255,${0.12 - i * 0.03})`,
                            background: `radial-gradient(circle, rgba(255,255,255,${0.04 - i * 0.01}), transparent)`,
                        }} />
                    ))}

                    { }
                    <div style={{
                        position: 'absolute', top: '8%', left: '18%', width: '40%', height: '35%',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)',
                        filter: 'blur(4px)',
                        pointerEvents: 'none',
                    }} />

                    { }
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', zIndex: 2 }}>
                        <motion.div
                            style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 8px rgba(0,212,255,1))' }}
                            animate={{ scale: hover ? [1, 1.15, 1] : 1 }}
                            transition={{ duration: 1.2, repeat: Infinity }}>
                            ⚡
                        </motion.div>
                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.18em', color: hover ? '#ffffff' : 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>
                            START
                        </span>
                        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.45rem', fontWeight: 700, letterSpacing: '0.14em', color: hover ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                            ENGINE
                        </span>
                    </div>
                </motion.button>

                { }
                {[0, 90, 180, 270].map(deg => (
                    <motion.div key={deg} style={{
                        position: 'absolute', width: 6, height: 6, borderRadius: '50%',
                        background: '#00d4ff',
                        boxShadow: '0 0 10px #00d4ff, 0 0 20px rgba(0,212,255,0.6)',
                        top: `calc(50% + ${Math.sin(deg * Math.PI / 180) * 88}px - 3px)`,
                        left: `calc(50% + ${Math.cos(deg * Math.PI / 180) * 88}px - 3px)`,
                    }}
                        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: deg / 360 * 2 }}
                    />
                ))}
            </div>
        </div>
    );
}

function LightOnOverlay({ active, onDone }) {
    useEffect(() => {
        if (active) {
            const t = setTimeout(onDone, 1600);
            return () => clearTimeout(t);
        }
    }, [active, onDone]);

    return (
        <AnimatePresence>
            {active && (
                <motion.div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #00d4ff 20%, #001a3a 60%, #020714 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                    initial={{ opacity: 0, scale: 0.02 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.02, 1.4, 1, 1] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, times: [0, 0.25, 0.7, 1], ease: 'easeOut' }}
                >
                    <motion.div
                        style={{ fontFamily: 'Orbitron, monospace', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.3em', color: '#020714' }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 1.2] }}
                        transition={{ duration: 1.2, times: [0, 0.4, 1] }}>
                        INITIALIZING…
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function SplashPage() {
    const [firing, setFiring] = useState(false);
    const [lightOn, setLightOn] = useState(false);
    const navigate = useNavigate();

    const handleStart = useCallback(() => {
        if (firing) return;
        playEngineStart();
        setFiring(true);
        setLightOn(true);
    }, [firing]);

    const handleLightDone = useCallback(() => {

        sessionStorage.setItem('splash_seen', '1');
        navigate('/login');
    }, [navigate]);

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, #020d1f 0%, #010811 50%, #020714 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
        }}>
            { }
            <ParticleCanvas firing={firing} />

            { }
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: `
          linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)
        `,
                backgroundSize: '60px 60px',
                maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0.8) 30%, transparent 100%)',
            }} />

            { }
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos, i) => (
                <div key={pos} style={{
                    position: 'absolute',
                    top: pos.includes('top') ? 24 : 'auto',
                    bottom: pos.includes('bottom') ? 24 : 'auto',
                    left: pos.includes('left') ? 24 : 'auto',
                    right: pos.includes('right') ? 24 : 'auto',
                    fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', fontWeight: 700,
                    color: 'rgba(0,212,255,0.3)', letterSpacing: '0.15em',
                    lineHeight: 1.8,
                }}>
                    {pos === 'top-left' ? ['APP READER', 'v2.0.0'] :
                        pos === 'top-right' ? ['AI READINESS', 'ENGINE'] :
                            pos === 'bottom-left' ? ['56 RULES', '9 LAYERS'] :
                                ['FASTAPI + MONGODB', 'JARVIS CORE']}
                </div>
            ))}

            { }
            <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48, position: 'relative', zIndex: 10 }}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>

                { }
                <div style={{ textAlign: 'center' }}>
                    <motion.h1 style={{
                        fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
                        background: 'linear-gradient(135deg, #5AC8FA 0%, #00d4ff 40%, #ffffff 60%, #9d4edd 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        letterSpacing: '0.12em', lineHeight: 1.1, marginBottom: 12,
                        filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.5))',
                    }}
                        animate={{ textShadow: ['0 0 30px rgba(0,212,255,0)', '0 0 60px rgba(0,212,255,0.4)', '0 0 30px rgba(0,212,255,0)'] }}
                        transition={{ duration: 3, repeat: Infinity }}>
                        JARVIS
                    </motion.h1>
                    <p style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', letterSpacing: '0.35em', color: 'rgba(0,212,255,0.55)', fontWeight: 700 }}>
                        AI READINESS ASSESSMENT SYSTEM
                    </p>
                </div>

                { }
                <EngineButton onClick={handleStart} phase={firing ? 'firing' : 'idle'} />

                { }
                <motion.p style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(0,212,255,0.3)', textAlign: 'center' }}
                    animate={{ opacity: firing ? 0 : [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2.4, repeat: Infinity }}>
                    CLICK TO INITIALIZE SYSTEM
                </motion.p>
            </motion.div>

            { }
            <LightOnOverlay active={lightOn} onDone={handleLightDone} />
        </div>
    );
}
