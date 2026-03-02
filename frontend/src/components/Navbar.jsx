import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Upload, User, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/apiClient';

const NAV = [
    { to: '/dashboard', icon: Home, label: 'Home', grad: 'linear-gradient(135deg,#0ea5e9,#6366f1)', glow: '0 4px 16px rgba(14,165,233,0.5)' },
    { to: '/upload', icon: Upload, label: 'Analyse', grad: 'linear-gradient(135deg,#a855f7,#ec4899)', glow: '0 4px 16px rgba(168,85,247,0.5)' },
    { to: '/profile', icon: User, label: 'Profile', grad: 'linear-gradient(135deg,#00d4ff,#00ff9d)', glow: '0 4px 16px rgba(0,212,255,0.5)' },
    { to: '/settings', icon: Settings, label: 'Config', grad: 'linear-gradient(135deg,#ffd700,#ff8c00)', glow: '0 4px 16px rgba(255,215,0,0.5)' },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [online, setOnline] = useState(true);
    const [hover, setHover] = useState(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll);
        api.get('/system/internet').then(r => setOnline(r.data.online)).catch(() => setOnline(false));
        const iv = setInterval(() => {
            api.get('/system/internet').then(r => setOnline(r.data.online)).catch(() => setOnline(false));
        }, 30_000);
        return () => { window.removeEventListener('scroll', onScroll); clearInterval(iv); };
    }, []);

    return (
        <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: scrolled ? 'rgba(2,7,20,0.97)' : 'rgba(5,13,30,0.6)',
                borderBottom: `1px solid ${scrolled ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.06)'}`,
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                transition: 'all 350ms ease',
            }}
        >
            { }
            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent 0%,#00d4ff 20%,#9d4edd 50%,#ffd700 80%,transparent 100%)', opacity: 0.65 }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', maxWidth: 1200, margin: '0 auto', height: 64 }}>

                { }
                <motion.div
                    onClick={() => navigate('/dashboard')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                >
                    { }
                    <div style={{ position: 'relative', width: 40, height: 40 }}>
                        { }
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--j-core)', borderRightColor: 'var(--j-core)', animation: 'spin 2s linear infinite' }} />
                        { }
                        <div style={{ position: 'absolute', inset: 5, borderRadius: '50%', border: '1.5px solid transparent', borderBottomColor: 'var(--j-gold)', animation: 'spin 1.4s linear infinite reverse' }} />
                        { }
                        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: 'radial-gradient(circle, #00d4ff, #003a5e)', display: 'grid', placeItems: 'center', boxShadow: '0 0 12px rgba(0,212,255,0.8), 0 0 30px rgba(0,212,255,0.3)', animation: 'arcCore 2.5s ease-in-out infinite' }}>
                            <span style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 900, fontSize: '0.45rem', color: 'white', letterSpacing: '0.02em' }}>AR</span>
                        </div>
                    </div>
                    <div>
                        <p style={{ fontFamily: 'Orbitron,sans-serif', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.04em', color: 'var(--t0)', lineHeight: 1.1 }}>App Reader</p>
                        <p style={{ fontSize: '0.52rem', color: 'var(--j-core)', letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>J.A.R.V.I.S Mode</p>
                    </div>
                </motion.div>

                { }
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {NAV.map(({ to, icon: Icon, label, grad, glow }) => (
                        <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
                            {({ isActive }) => (
                                <div
                                    className="ios-icon"
                                    style={{ width: 'auto', gap: 4 }}
                                    onMouseEnter={() => setHover(label)}
                                    onMouseLeave={() => setHover(null)}
                                >
                                    <motion.div
                                        className="ios-icon-body"
                                        style={{
                                            width: 42, height: 42,
                                            background: isActive ? grad : 'rgba(255,255,255,0.05)',
                                            boxShadow: isActive ? glow : '0 2px 8px rgba(0,0,0,0.4)',
                                            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.07)',
                                        }}
                                        whileHover={{ scale: 1.12, y: -3 }}
                                        whileTap={{ scale: 0.88 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    >
                                        <Icon size={18} style={{ color: isActive ? 'white' : 'rgba(0,212,255,0.7)', filter: isActive ? 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' : 'none', position: 'relative', zIndex: 3 }} />
                                    </motion.div>
                                    <AnimatePresence>
                                        {hover === label && (
                                            <motion.span
                                                style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,13,30,0.95)', color: 'var(--t1)', fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(0,212,255,0.2)', whiteSpace: 'nowrap', zIndex: 999, pointerEvents: 'none' }}
                                                initial={{ opacity: 0, y: -5, scale: 0.8 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                { }
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    { }
                    <motion.div
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: online ? 'rgba(0,255,157,0.08)' : 'rgba(255,68,68,0.08)', border: `1px solid ${online ? 'rgba(0,255,157,0.2)' : 'rgba(255,68,68,0.2)'}` }}
                        animate={{ boxShadow: online ? ['0 0 0 rgba(0,255,157,0)', '0 0 12px rgba(0,255,157,0.3)', '0 0 0 rgba(0,255,157,0)'] : [] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    >
                        {online ? <Wifi size={11} style={{ color: 'var(--j-green)' }} /> : <WifiOff size={11} style={{ color: 'var(--j-red)' }} />}
                        <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.14em', color: online ? 'var(--j-green)' : 'var(--j-red)' }}>
                            {online ? 'LIVE' : 'OFFLINE'}
                        </span>
                    </motion.div>

                    { }
                    <div className="jarvis-avatar" style={{ width: 36, height: 36, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                        <div className="jarvis-orbit-1" style={{ inset: -5 }} />
                        <div className="jarvis-orbit-2" style={{ inset: -2 }} />
                        <div className="jarvis-glow" style={{ inset: -10 }} />
                        <img
                            className="jarvis-avatar-img"
                            src={user?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=00d4ff&color=000&bold=true&size=80`}
                            style={{ width: 36, height: 36 }}
                            alt="avatar"
                        />
                        <div className="jarvis-status" />
                    </div>

                    { }
                    <motion.button
                        onClick={() => { logout(); navigate('/login'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.18)', color: 'var(--j-red)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.04em' }}
                        whileHover={{ scale: 1.06, background: 'rgba(255,68,68,0.16)' }}
                        whileTap={{ scale: 0.94 }}
                    >
                        <LogOut size={13} />
                    </motion.button>
                </div>
            </div>
        </motion.header>
    );
}
