import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
    const [form, setForm] = useState({ email: '', password: '', full_name: '' });
    const [show, setShow] = useState(false);
    const [err, setErr] = useState('');
    const { signup, loading } = useAuth();
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault(); setErr('');
        if (form.password.length < 8) { setErr('Password must be at least 8 characters.'); return; }
        try { await signup(form); navigate('/dashboard'); }
        catch (ex) { setErr(ex.response?.data?.detail || 'Signup failed.'); }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', zIndex: 2 }}>
            <div style={{ position: 'fixed', top: '30%', right: '12%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,170,0.06), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '20%', left: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,240,255,0.07), transparent 70%)', pointerEvents: 'none' }} />

            <motion.div className="glass-panel" style={{ padding: 40, maxWidth: 480, width: '100%' }}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>

                { }
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--cy-green), var(--cy-cyan))', display: 'grid', placeItems: 'center', fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '0.72rem', color: '#000', boxShadow: 'var(--cy-glow-green)' }}>AR</div>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '0.95rem', color: 'var(--cy-text-1)' }}>App Reader</span>
                </div>

                <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '1.2rem', marginBottom: 6, color: 'var(--cy-text-1)' }}>Create Account</h1>
                <p style={{ color: 'var(--cy-text-2)', fontSize: '0.82rem', marginBottom: 28 }}>Start analysing your AI readiness today</p>

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.3)', color: 'var(--cy-pink)', fontSize: '0.82rem' }}>{err}</div>}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cy-text-3)', marginBottom: 8 }}>
                            <User size={11} style={{ display: 'inline', marginRight: 5 }} />Full Name
                        </label>
                        <input className="input-modern" type="text" placeholder="Your full name"
                            value={form.full_name} onChange={e => setForm(s => ({ ...s, full_name: e.target.value }))} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cy-text-3)', marginBottom: 8 }}>
                            <Mail size={11} style={{ display: 'inline', marginRight: 5 }} />Email
                        </label>
                        <input className="input-modern" type="email" placeholder="you@example.com" required
                            value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cy-text-3)', marginBottom: 8 }}>
                            <Lock size={11} style={{ display: 'inline', marginRight: 5 }} />Password (min 8 chars)
                        </label>
                        <input className="input-modern" type={show ? 'text' : 'password'} placeholder="••••••••" required
                            value={form.password} onChange={e => setForm(s => ({ ...s, password: e.target.value }))}
                            style={{ paddingRight: 44 }} />
                        <button type="button" onClick={() => setShow(p => !p)}
                            style={{ position: 'absolute', right: 14, bottom: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cy-text-3)' }}>
                            {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <motion.button type="submit" disabled={loading} className="btn-cyber btn-cyber-primary shine-btn"
                        style={{ padding: '14px 0', borderRadius: 12, fontSize: '0.9rem', letterSpacing: '0.08em', marginTop: 4 }}
                        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
                        <Zap size={16} />{loading ? 'Creating Account…' : 'Create Account'}
                    </motion.button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--cy-text-2)', fontSize: '0.82rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--cy-cyan)', fontWeight: 700 }}>Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
