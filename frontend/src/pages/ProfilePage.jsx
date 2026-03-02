import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/apiClient';
import sounds from '../utils/sound';
import { User, Image, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();
    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        profile_image: user?.profile_image || '',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [ok, setOk] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        sounds.launch();
        setSaving(true); setMsg(''); setOk(false);
        try {
            const { data } = await api.patch('/user/me', form);
            localStorage.setItem('ar_user', JSON.stringify(data));
            setMsg('Profile updated!'); setOk(true);
            sounds.success();
        } catch {
            setMsg('Failed to update. Try again.');
            sounds.error();
        } finally { setSaving(false); }
    };

    return (
        <motion.div
            style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            { }
            <div className="glass-panel hud-corners" style={{ padding: '28px 24px', textAlign: 'center' }}>
                { }
                <div className="jarvis-avatar" style={{ width: 88, height: 88, margin: '0 auto 16px' }}>
                    <div className="jarvis-orbit-1" />
                    <div className="jarvis-orbit-2" />
                    <div className="jarvis-glow" style={{ inset: -18 }} />
                    <img
                        className="jarvis-avatar-img"
                        src={form.profile_image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=00d4ff&color=000&bold=true&size=128`}
                        style={{ width: 88, height: 88 }}
                        alt="avatar"
                    />
                    <div className="jarvis-status" />
                </div>
                <h1 className="hud-title" style={{ fontSize: '1.1rem', marginBottom: 4 }}>
                    <span className="gradient-text">{user?.full_name || 'User'}</span>
                </h1>
                <p style={{ color: 'var(--t3)', fontSize: '0.8rem' }}>{user?.email}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                    <span className="chip chip-cyan">ID: {user?.id?.slice(0, 8)}…</span>
                    {user?.is_admin && <span className="chip chip-gold">★ Admin</span>}
                </div>
            </div>

            { }
            <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 20 }}>
                    Edit Profile
                </h2>
                <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
                            <User size={10} style={{ display: 'inline', marginRight: 5 }} />Full Name
                        </label>
                        <input
                            className="input-jarvis"
                            value={form.full_name}
                            onChange={e => { sounds.type(); setForm(s => ({ ...s, full_name: e.target.value })); }}
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
                            <Image size={10} style={{ display: 'inline', marginRight: 5 }} />Profile Image URL
                        </label>
                        <input
                            className="input-jarvis"
                            value={form.profile_image}
                            onChange={e => { sounds.type(); setForm(s => ({ ...s, profile_image: e.target.value })); }}
                            placeholder="https://example.com/avatar.png"
                        />
                    </div>

                    <AnimatePresence>
                        {msg && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{
                                    padding: '10px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
                                    background: ok ? 'rgba(0,255,157,0.08)' : 'rgba(255,68,68,0.08)',
                                    border: `1px solid ${ok ? 'rgba(0,255,157,0.3)' : 'rgba(255,68,68,0.3)'}`,
                                    color: ok ? 'var(--j-green)' : 'var(--j-red)', fontSize: '0.82rem', fontWeight: 700
                                }}
                            >
                                {ok && <CheckCircle size={14} />} {msg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        type="submit" disabled={saving}
                        className="btn-jarvis btn-jarvis-primary"
                        style={{ padding: '13px 0', borderRadius: 14, width: '100%' }}
                        onClick={() => sounds.click()}
                        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                    >
                        <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
}
