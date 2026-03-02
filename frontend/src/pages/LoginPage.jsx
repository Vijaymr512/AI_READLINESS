import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertTriangle, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import sounds from '../utils/sound';

const RINGS = [
    { r: 130, w: 1.5, dash: '8 4', dur: 18, rev: false, color: 'rgba(0,212,255,0.55)', glow: '0 0 12px rgba(0,212,255,0.4)' },
    { r: 165, w: 1, dash: '3 6', dur: 26, rev: true, color: 'rgba(157,78,237,0.40)', glow: 'none' },
    { r: 200, w: 2, dash: '14 3', dur: 14, rev: false, color: 'rgba(0,212,255,0.30)', glow: '0 0 8px rgba(0,212,255,0.2)' },
    { r: 238, w: 1, dash: '2 8', dur: 32, rev: true, color: 'rgba(255,215,0,0.25)', glow: 'none' },
    { r: 278, w: 1.5, dash: '20 4', dur: 22, rev: false, color: 'rgba(0,212,255,0.18)', glow: 'none' },
    { r: 320, w: 0.8, dash: '1 10', dur: 40, rev: true, color: 'rgba(157,78,237,0.15)', glow: 'none' },
];

const TICKS = [0, 45, 90, 135, 180, 225, 270, 315];

function RingCanvas({ zoom }) {
    const size = 700;
    const cx = size / 2;
    return (
        <svg
            width={size} height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: `translate(-50%, -50%) scale(${zoom})`,
                transition: 'transform 0.15s ease-out',
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'visible',
            }}
        >
            <defs>
                {RINGS.map((rg, i) => (
                    <filter key={i} id={`glow${i}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                ))}
            </defs>

            {RINGS.map((rg, i) => (
                <g key={i}>
                    { }
                    <circle
                        cx={cx} cy={cx} r={rg.r}
                        fill="none"
                        stroke={rg.color}
                        strokeWidth={rg.w}
                        strokeDasharray={rg.dash}
                        filter={rg.glow !== 'none' ? `url(#glow${i})` : undefined}
                        style={{ animation: `arcSpin ${rg.dur}s linear infinite ${rg.rev ? 'reverse' : 'normal'}` }}
                    />
                    { }
                    {i % 2 === 0 && TICKS.map(angle => {
                        const rad = (angle * Math.PI) / 180;
                        const x1 = cx + (rg.r - 6) * Math.cos(rad);
                        const y1 = cx + (rg.r - 6) * Math.sin(rad);
                        const x2 = cx + (rg.r + 6) * Math.cos(rad);
                        const y2 = cx + (rg.r + 6) * Math.sin(rad);
                        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={rg.color} strokeWidth="1.5" opacity="0.6" />;
                    })}
                </g>
            ))}

            { }
            {[40, 56, 72].map((r, i) => (
                <circle key={i} cx={cx} cy={cx} r={r} fill="none"
                    stroke={`rgba(0,212,255,${0.5 - i * 0.13})`}
                    strokeWidth={i === 0 ? 2.5 : 1.5}
                    style={{ animation: `arcSpin ${5 + i * 2}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}` }}
                    filter={i === 0 ? 'url(#glow0)' : undefined}
                />
            ))}

            { }
            {[
                { angle: -30, r: 310, text: 'AUTH-SYS' },
                { angle: 30, r: 310, text: 'SCAN-v9' },
                { angle: 150, r: 310, text: '9-LAYER' },
                { angle: 210, r: 310, text: 'J.A.R.V.I.S' },
            ].map(({ angle, r: lr, text }) => {
                const rad = (angle * Math.PI) / 180;
                return (
                    <text key={text}
                        x={cx + lr * Math.cos(rad)} y={cx + lr * Math.sin(rad)}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(0,212,255,0.35)"
                        fontSize="7" fontFamily="Orbitron, monospace" fontWeight="600" letterSpacing="1">
                        {text}
                    </text>
                );
            })}
        </svg>
    );
}

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [show, setShow] = useState(false);
    const [err, setErr] = useState('');
    const [ready, setReady] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [zoomDir, setZoomDir] = useState(1);
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const zoomRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => sounds.arcOnline(), 400);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        let z = 1, dir = 1;
        const iv = setInterval(() => {
            z += dir * 0.0018;
            if (z >= 1.055) dir = -1;
            if (z <= 0.955) dir = 1;
            setZoom(z);
        }, 16);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        setReady(form.email.length > 4 && form.password.length >= 8);
    }, [form]);

    const handleChange = (field, val) => {
        sounds.type();
        setForm(s => ({ ...s, [field]: val }));
        setErr('');
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        sounds.launch();
        try {
            await login(form);
            sounds.success();
            navigate('/dashboard');
        } catch {
            sounds.error();
            setErr('WRONG DETAILS — RETRY AGAIN');
        }
    };

    return (
        <div style={{
            minHeight: '100vh', overflow: 'hidden',
            position: 'relative', display: 'grid', placeItems: 'center',
            background: 'radial-gradient(ellipse at 50% 50%, #040e28 0%, #020714 100%)',
        }}>
            { }
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.025) 1px,transparent 1px)', backgroundSize: '55px 55px', pointerEvents: 'none' }} />

            { }
            <motion.div
                style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)', top: 0, zIndex: 1, pointerEvents: 'none' }}
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            { }
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 700, height: 700, zIndex: 2 }}>

                { }
                <RingCanvas zoom={zoom} />

                { }
                <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)', animation: 'arcCore 3s ease-in-out infinite', pointerEvents: 'none' }} />

                { }
                <motion.div
                    style={{
                        position: 'relative', zIndex: 10,
                        width: 340,
                        background: 'rgba(4,14,40,0.92)',
                        borderRadius: 22,
                        border: '1px solid rgba(0,212,255,0.22)',
                        padding: '32px 28px',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(0,212,255,0.1)',
                    }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                >
                    { }
                    {[
                        { top: 10, left: 10, borderWidth: '1px 0 0 1px' },
                        { top: 10, right: 10, borderWidth: '1px 1px 0 0' },
                        { bottom: 10, left: 10, borderWidth: '0 0 1px 1px' },
                        { bottom: 10, right: 10, borderWidth: '0 1px 1px 0' },
                    ].map((s, i) => (
                        <div key={i} style={{ position: 'absolute', width: 16, height: 16, borderColor: 'var(--j-core)', borderStyle: 'solid', opacity: 0.5, ...s }} />
                    ))}

                    { }
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        { }
                        <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 12px' }}>
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--j-core)', borderRightColor: 'var(--j-core)', animation: 'arcSpin 1.8s linear infinite', boxShadow: '0 0 16px rgba(0,212,255,0.5)' }} />
                            <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1.5px solid transparent', borderBottomColor: 'var(--j-gold)', animation: 'arcSpin 1.2s linear infinite reverse' }} />
                            <div style={{ position: 'absolute', inset: 15, borderRadius: '50%', background: 'radial-gradient(circle,#00d4ff,#003a5e)', display: 'grid', placeItems: 'center', boxShadow: '0 0 20px rgba(0,212,255,0.9)' }}>
                                <Cpu size={12} style={{ color: 'white' }} />
                            </div>
                        </div>
                        <p style={{ fontFamily: 'Orbitron,monospace', fontWeight: 900, fontSize: '1rem', letterSpacing: '0.08em', color: 'var(--t0)' }}>APP READER</p>
                        <p style={{ fontSize: '0.58rem', color: 'var(--j-core)', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginTop: 3, opacity: 0.7 }}>J.A.R.V.I.S Interface</p>
                    </div>

                    { }
                    <AnimatePresence>
                        {err && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.35)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <AlertTriangle size={14} style={{ color: 'var(--j-red)', flexShrink: 0 }} className="icon-shake" />
                                <p style={{ color: 'var(--j-red)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em' }}>{err}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        { }
                        <div>
                            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>
                                <Mail size={10} style={{ display: 'inline', marginRight: 5 }} />EMAIL
                            </label>
                            <input
                                className="input-jarvis"
                                type="email" required
                                placeholder="agent@shield.com"
                                value={form.email}
                                onChange={e => handleChange('email', e.target.value)}
                            />
                        </div>

                        { }
                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>
                                <Lock size={10} style={{ display: 'inline', marginRight: 5 }} />PASSWORD
                            </label>
                            <input
                                className="input-jarvis"
                                type={show ? 'text' : 'password'} required
                                placeholder="••••••••••"
                                value={form.password}
                                onChange={e => handleChange('password', e.target.value)}
                                style={{ paddingRight: 46 }}
                            />
                            <button type="button"
                                onClick={() => { sounds.click(); setShow(p => !p); }}
                                style={{ position: 'absolute', right: 14, bottom: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0 }}>
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        { }
                        <motion.button
                            type="submit"
                            disabled={loading}
                            onClick={() => sounds.click()}
                            className="btn-jarvis"
                            style={{
                                width: '100%', marginTop: 6,
                                padding: '15px 0',
                                borderRadius: 14,
                                background: ready
                                    ? 'linear-gradient(135deg, #00d4ff 0%, #00a8ff 40%, #9d4edd 100%)'
                                    : 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(157,78,237,0.15))',
                                border: ready ? 'none' : '1px solid rgba(0,212,255,0.25)',
                                color: ready ? 'white' : 'var(--j-core)',
                                fontSize: ready ? '1rem' : '0.9rem',
                                fontWeight: 900,
                                letterSpacing: ready ? '0.18em' : '0.08em',
                                boxShadow: ready ? '0 6px 30px rgba(0,212,255,0.45), 0 0 60px rgba(0,212,255,0.15)' : 'none',
                                transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                                fontFamily: ready ? 'Orbitron, monospace' : 'Inter, sans-serif',
                            }}
                            whileHover={ready ? { scale: 1.04, y: -2 } : { scale: 1.01 }}
                            whileTap={{ scale: 0.95 }}
                            animate={ready ? {
                                boxShadow: ['0 6px 30px rgba(0,212,255,0.4)', '0 6px 40px rgba(0,212,255,0.7)', '0 6px 30px rgba(0,212,255,0.4)'],
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                                    INITIATING...
                                </span>
                            ) : ready ? '▶  START' : 'SIGN IN'}
                        </motion.button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--t3)', fontSize: '0.78rem' }}>
                        New agent?{' '}
                        <Link to="/signup" style={{ color: 'var(--j-core)', fontWeight: 700, textDecoration: 'none' }}
                            onClick={() => sounds.click()}>Register</Link>
                    </p>
                </motion.div>
            </div>

            { }
            {[
                { style: { top: 24, left: 24 }, label: 'SYS.ONLINE' },
                { style: { top: 24, right: 24 }, label: '9-LAYER.READY' },
                { style: { bottom: 24, left: 24 }, label: 'SECURE.CHANNEL' },
                { style: { bottom: 24, right: 24 }, label: 'v2.0.JARVIS' },
            ].map(({ style: ps, label }) => (
                <div key={label} style={{ position: 'absolute', ...ps, fontFamily: 'Orbitron,monospace', fontSize: '0.55rem', color: 'rgba(0,212,255,0.3)', fontWeight: 600, letterSpacing: '0.15em', userSelect: 'none' }}>
                    {label}
                </div>
            ))}
        </div>
    );
}
