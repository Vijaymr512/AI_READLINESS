import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import sounds from '../utils/sound';
import { LogOut, Trash2, Shield, Cpu, Info } from 'lucide-react';

const INFO_ROWS = [
    { label: 'Version', value: 'v2.0.0' },
    { label: 'Engine', value: '9-Layer Analysis' },
    { label: 'Rules', value: '56 Static Rules' },
    { label: 'Backend', value: 'FastAPI + MongoDB' },
    { label: 'Frontend', value: 'React + Framer Motion' },
    { label: 'Auth', value: 'JWT Bearer Token' },
];

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border-dim)' }}>
            <span style={{ color: 'var(--t2)', fontSize: '0.84rem' }}>{label}</span>
            <span style={{ color: 'var(--j-core)', fontWeight: 700, fontSize: '0.84rem', fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
        </div>
    );
}

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        sounds.click();
        logout();
        navigate('/login');
    };

    const clearData = () => {
        sounds.error();
        if (!window.confirm('Clear all local data and logout?')) return;
        localStorage.clear();
        navigate('/login');
    };

    return (
        <motion.div
            style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            { }
            <div className="glass-panel hud-corners" style={{ padding: '20px 24px' }}>
                <h1 className="hud-title gradient-text" style={{ fontSize: '1.2rem', marginBottom: 4 }}>Settings</h1>
                <p style={{ color: 'var(--t3)', fontSize: '0.8rem' }}>Account and application configuration.</p>
            </div>

            { }
            <div className="glass-panel" style={{ padding: 24 }}>
                <h2 style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 16 }}>
                    <Shield size={10} style={{ display: 'inline', marginRight: 5 }} />Account
                </h2>
                <Row label="Email" value={user?.email || '—'} />
                <Row label="Name" value={user?.full_name || '—'} />
                <Row label="User ID" value={(user?.id?.slice(0, 10) + '…') || '—'} />
                <Row label="Role" value={user?.is_admin ? '★ Admin' : 'User'} />
            </div>

            { }
            <div className="glass-panel" style={{ padding: 24 }}>
                <h2 style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 16 }}>
                    <Info size={10} style={{ display: 'inline', marginRight: 5 }} />About App Reader
                </h2>
                {INFO_ROWS.map(r => <Row key={r.label} label={r.label} value={r.value} />)}
            </div>

            { }
            <div className="glass-panel" style={{ padding: 24, border: '1px solid rgba(255,68,68,0.15)' }}>
                <h2 style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--j-red)', marginBottom: 16 }}>
                    Danger Zone
                </h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                        onClick={handleLogout}
                        style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: 'var(--j-red)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        whileHover={{ scale: 1.02, background: 'rgba(255,68,68,0.14)' }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <LogOut size={14} /> Logout
                    </motion.button>
                    <motion.button
                        onClick={clearData}
                        style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'rgba(255,68,68,0.04)', border: '1px solid rgba(255,68,68,0.12)', color: 'rgba(255,68,68,0.55)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        whileHover={{ scale: 1.02, color: 'var(--j-red)' }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <Trash2 size={14} /> Clear Local Data
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
