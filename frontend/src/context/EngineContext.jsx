
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

const EngineContext = createContext(null);
export const useEngine = () => useContext(EngineContext);

function playPowerOff() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.4, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        g.connect(ctx.destination);
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.0);
        osc.connect(g);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
    } catch (_) { }
}

function playPowerOn() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        g.connect(ctx.destination);
        [110, 220, 440].forEach((f, i) => {
            const o = ctx.createOscillator();
            o.type = 'triangle';
            o.frequency.value = f;
            const og = ctx.createGain();
            og.gain.value = 0.2;
            o.connect(og); og.connect(ctx.destination);
            o.start(ctx.currentTime + i * 0.06);
            o.stop(ctx.currentTime + 0.8);
        });
    } catch (_) { }
}

export function EngineProvider({ children }) {
    const [engineOn, setEngineOn] = useState(true);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const turnOff = useCallback(() => {
        playPowerOff();
        setEngineOn(false);
        logout();

        setTimeout(() => navigate('/splash', { replace: true }), 600);
    }, [logout, navigate]);

    const turnOn = useCallback(() => {
        playPowerOn();
        setEngineOn(true);
    }, []);

    const toggle = useCallback(() => {
        if (engineOn) turnOff();
        else turnOn();
    }, [engineOn, turnOff, turnOn]);

    return (
        <EngineContext.Provider value={{ engineOn, toggle, turnOff, turnOn }}>
            {children}
            { }
            {location.pathname !== '/splash' && (
                <EngineToggleButton engineOn={engineOn} onToggle={toggle} />
            )}
        </EngineContext.Provider>
    );
}

function EngineToggleButton({ engineOn, onToggle }) {
    const [hover, setHover] = useState(false);
    const [confirm, setConfirm] = useState(false);

    const handleClick = () => {
        if (engineOn) {

            if (confirm) { setConfirm(false); onToggle(); }
            else { setConfirm(true); setTimeout(() => setConfirm(false), 3000); }
        } else {
            onToggle();
        }
    };

    const SIZE = 52;
    const ringR = 20, ringC = 2 * Math.PI * ringR;

    return (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999 }}>
            <AnimatePresence>
                {confirm && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: 'absolute', bottom: SIZE + 12, right: 0,
                            background: 'rgba(10,20,40,0.95)', border: '1px solid rgba(255,68,68,0.4)',
                            borderRadius: 12, padding: '8px 14px', whiteSpace: 'nowrap',
                            color: 'rgba(255,68,68,0.9)', fontSize: '0.7rem', fontWeight: 700,
                            fontFamily: 'Orbitron, monospace', letterSpacing: '0.12em',
                            boxShadow: '0 0 20px rgba(255,68,68,0.15)',
                        }}>
                        ⚠ TAP AGAIN TO POWER OFF
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={handleClick}
                style={{
                    width: SIZE, height: SIZE, borderRadius: '50%', border: 'none',
                    cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: engineOn
                        ? 'radial-gradient(circle at 38% 32%, rgba(100,235,255,0.9), #007a9e 40%, #001428)'
                        : 'radial-gradient(circle at 38% 32%, rgba(255,80,80,0.5), #400 50%, #1a0000)',
                    boxShadow: engineOn
                        ? `0 0 ${hover ? 30 : 18}px rgba(0,212,255,${hover ? 0.9 : 0.55}), 0 0 6px rgba(0,212,255,0.3)`
                        : `0 0 ${hover ? 20 : 10}px rgba(255,68,68,${hover ? 0.7 : 0.3})`,
                    transition: 'all 0.3s ease',
                }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
            >
                { }
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}>
                    <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2}
                        fill="none"
                        stroke={engineOn ? 'rgba(0,212,255,0.25)' : 'rgba(255,68,68,0.2)'}
                        strokeWidth="1.5"
                        strokeDasharray="3 4"
                    />
                    { }
                    {confirm && (
                        <motion.circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2}
                            fill="none" stroke="rgba(255,68,68,0.8)" strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={`0 ${2 * Math.PI * (SIZE / 2 - 2)}`}
                            animate={{ strokeDasharray: [`${2 * Math.PI * (SIZE / 2 - 2)} 0`, `0 ${2 * Math.PI * (SIZE / 2 - 2)}`] }}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                            transition={{ duration: 3, ease: 'linear' }}
                        />
                    )}
                </svg>

                { }
                <div style={{
                    position: 'absolute', top: '12%', left: '18%', width: '36%', height: '28%',
                    borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.35), transparent)',
                    filter: 'blur(3px)', pointerEvents: 'none',
                }} />

                { }
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    style={{ position: 'relative', zIndex: 2 }}>
                    <path d="M12 2v8" stroke={engineOn ? '#00d4ff' : '#ff4444'} strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M18.4 5.6a9 9 0 1 1-12.8 0" stroke={engineOn ? '#00d4ff' : '#ff4444'} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>

                { }
                {engineOn && (
                    <motion.div style={{
                        position: 'absolute', inset: -4, borderRadius: '50%',
                        border: `1.5px solid rgba(0,212,255,${hover ? 0.7 : 0.3})`,
                        pointerEvents: 'none',
                    }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    />
                )}
            </motion.button>

            { }
            <AnimatePresence>
                {hover && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', bottom: -20, right: 0,
                            fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.15em',
                            color: engineOn ? 'rgba(0,212,255,0.65)' : 'rgba(255,68,68,0.65)',
                            fontFamily: 'Orbitron, monospace', whiteSpace: 'nowrap',
                        }}>
                        ENGINE {engineOn ? 'ON' : 'OFF'}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
