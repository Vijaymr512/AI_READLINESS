import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, BarChart3, Activity, Shield, Trash2,
    Eye, RefreshCw, Search, AlertTriangle, CheckCircle,
    TrendingUp, Database, X
} from 'lucide-react';
import {
    LineChart, Line, PieChart, Pie, Cell,
    ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis,
} from 'recharts';
import api from '../services/apiClient';
import sounds from '../utils/sound';

const PALETTE = {
    skyBlue: '#5AC8FA',
    teal: '#30D5C8',
    coral: '#FF6B6B',
    lavender: '#C084FC',
    gold: '#FFD700',
    green: '#22C55E',
    navy: '#1E3A5F',
};
const SC = { Strong: '#30D5C8', Moderate: '#FFD700', Weak: '#FF8C00', Critical: '#FF6B6B' };

const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(4,14,40,0.97)', border: '1px solid rgba(90,200,250,0.3)', borderRadius: 10, padding: '8px 14px', fontSize: '0.8rem' }}>
            <p style={{ color: '#5AC8FA' }}>{label}: <strong>{payload[0].value}</strong></p>
        </div>
    );
};

function AdminStat({ label, value, color, icon: Icon, sub }) {
    return (
        <motion.div style={{ padding: '20px', borderRadius: 18, background: `linear-gradient(135deg,${color}22,${color}08)`, border: `1px solid ${color}30`, position: 'relative', overflow: 'hidden' }}
            whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <div style={{ position: 'absolute', right: 16, top: 16, width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'grid', placeItems: 'center' }}>
                <Icon size={16} style={{ color }} />
            </div>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{label}</p>
            <p style={{ fontFamily: 'Orbitron,monospace', fontSize: '2.2rem', fontWeight: 900, color }}>{value ?? '—'}</p>
            {sub && <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{sub}</p>}
        </motion.div>
    );
}

const listV = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemV = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 24 } },
};

export default function AdminPage() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [detail, setDetail] = useState(null);

    const load = useCallback(async () => {
        sounds.startup();
        try {
            const [s, u, r] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/assessments'),
            ]);
            setStats(s.data);
            setUsers(u.data.users || []);
            setReports(r.data.assessments || []);
        } catch (e) {
            console.error('Admin load failed', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const deleteUser = async (id) => {
        sounds.error();
        if (!confirm('Delete this user + all their data?')) return;
        await api.delete(`/admin/users/${id}`);
        sounds.notify();
        setUsers(p => p.filter(u => u.id !== id));
    };

    const toggleAdmin = async (id, cur) => {
        sounds.click();
        await api.patch(`/admin/users/${id}/admin?is_admin=${!cur}`);
        setUsers(p => p.map(u => u.id === id ? { ...u, is_admin: !cur } : u));
    };

    const filteredUsers = search ? users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    ) : users;

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'users', label: `Users (${users.length})` },
        { id: 'reports', label: `Reports (${reports.length})` },
    ];

    if (loading) return (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
            <div style={{ position: 'relative', width: 60, height: 60 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#5AC8FA', animation: 'arcSpin 0.9s linear infinite' }} />
                <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: 'radial-gradient(circle,rgba(90,200,250,0.4),transparent)', animation: 'arcCore 2s infinite' }} />
            </div>
        </div>
    );

    const dist = stats?.score_distribution || [];
    const recent = stats?.recent_runs || [];
    const trendD = [...recent].reverse().map((r, i) => ({ run: `R${i + 1}`, score: r.score }));

    return (
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            { }
            <div className="glass-panel hud-corners" style={{ padding: '22px 28px', position: 'relative', overflow: 'hidden' }}>
                { }
                <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 120, height: 120, opacity: 0.25, pointerEvents: 'none' }}>
                    {[0, 20, 40].map((i) => (
                        <div key={i} style={{ position: 'absolute', inset: i, borderRadius: '50%', border: '1px solid #5AC8FA', animation: `arcSpin ${8 + i}s linear infinite` }} />
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Shield size={16} style={{ color: '#5AC8FA' }} className="icon-glow" />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', color: '#5AC8FA', textTransform: 'uppercase' }}>Admin Control Panel</span>
                </div>
                <h1 className="hud-title" style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 4 }}>
                    <span style={{ background: 'linear-gradient(135deg,#5AC8FA,#30D5C8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live Dashboard</span>
                </h1>
                <p style={{ color: 'var(--t3)', fontSize: '0.82rem' }}>Real-time user and assessment monitoring. Admin access only.</p>
            </div>

            { }
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14 }}>
                <AdminStat label="Total Users" value={stats?.total_users} color={PALETTE.skyBlue} icon={Users} sub={`+${stats?.new_users_today || 0} today`} />
                <AdminStat label="Assessments" value={stats?.total_assessments} color={PALETTE.teal} icon={Database} sub={`+${stats?.new_assessments_today || 0} today`} />
                <AdminStat label="AI Ready" value={dist.find(d => d._id === 'Strong')?.count || 0} color={PALETTE.green} icon={CheckCircle} />
                <AdminStat label="Critical Risk" value={dist.find(d => d._id === 'Critical')?.count || 0} color={PALETTE.coral} icon={AlertTriangle} />
            </div>

            { }
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: 'rgba(90,200,250,0.04)', border: '1px solid rgba(90,200,250,0.08)', width: 'fit-content' }}>
                {TABS.map(t => (
                    <motion.button key={t.id} onClick={() => { sounds.click(); setTab(t.id); }}
                        style={{
                            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                            background: tab === t.id ? 'linear-gradient(135deg,#5AC8FA,#30D5C8)' : 'transparent',
                            color: tab === t.id ? '#020714' : 'var(--t2)',
                            boxShadow: tab === t.id ? '0 4px 12px rgba(90,200,250,0.4)' : 'none',
                        }}
                        whileTap={{ scale: 0.95 }}>
                        {t.label}
                    </motion.button>
                ))}
                <motion.button onClick={() => { sounds.click(); load(); }}
                    style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(90,200,250,0.15)', background: 'transparent', color: '#5AC8FA', cursor: 'pointer' }}
                    whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}>
                    <RefreshCw size={13} />
                </motion.button>
            </div>

            { }
            {tab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                    { }
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.9rem', marginBottom: 14 }}>
                            <TrendingUp size={14} style={{ display: 'inline', marginRight: 6, color: '#5AC8FA' }} />Score Trend (last 30)
                        </h2>
                        <div style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendD}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,200,250,0.04)" />
                                    <XAxis dataKey="run" tick={{ fontSize: 8 }} stroke="var(--t4)" />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} stroke="var(--t4)" />
                                    <Tooltip content={<Tip />} />
                                    <Line type="monotone" dataKey="score" stroke="#5AC8FA" strokeWidth={2} dot={{ r: 3, fill: '#5AC8FA' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    { }
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.9rem', marginBottom: 14 }}>
                            <BarChart3 size={14} style={{ display: 'inline', marginRight: 6, color: '#30D5C8' }} />Readiness Distribution
                        </h2>
                        <div style={{ height: 160 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dist.map(d => ({ name: d._id, value: d.count }))} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={3}>
                                        {dist.map((e, i) => <Cell key={i} fill={SC[e._id] || '#5AC8FA'} />)}
                                    </Pie>
                                    <Tooltip content={<Tip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                            {dist.map(d => (
                                <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: SC[d._id] || '#5AC8FA', flexShrink: 0 }} />
                                    <span style={{ color: 'var(--t2)' }}>{d._id}: <strong style={{ color: 'var(--t0)' }}>{d.count}</strong></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            { }
            {tab === 'users' && (
                <div className="glass-panel" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.9rem' }}>All Users</h2>
                        <div style={{ position: 'relative' }}>
                            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                            <input value={search} onChange={e => { sounds.type(); setSearch(e.target.value); }}
                                placeholder="Search name or email..."
                                className="input-jarvis"
                                style={{ padding: '7px 10px 7px 28px', width: 220, borderRadius: 10, fontSize: '0.78rem', borderColor: 'rgba(90,200,250,0.2)' }}
                            />
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(90,200,250,0.08)' }}>
                                    {['Name', 'Email', 'Reports', 'Joined', 'Admin', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(90,200,250,0.4)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <motion.tbody variants={listV} initial="hidden" animate="visible">
                                {filteredUsers.map(u => (
                                    <motion.tr key={u.id} variants={itemV}
                                        style={{ borderBottom: '1px solid rgba(90,200,250,0.03)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,200,250,0.03)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '10px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <img src={u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'U')}&background=5AC8FA&color=000&size=40`}
                                                    style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(90,200,250,0.3)' }} alt="" />
                                                <span style={{ fontWeight: 600, color: 'var(--t0)' }}>{u.full_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 12px', color: 'var(--t2)', fontSize: '0.78rem' }}>{u.email}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ fontFamily: 'Orbitron,monospace', fontWeight: 800, color: '#5AC8FA', fontSize: '0.9rem' }}>{u.assessment_count || 0}</span>
                                        </td>
                                        <td style={{ padding: '10px 12px', color: 'var(--t3)', fontSize: '0.72rem' }}>
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <motion.button onClick={() => toggleAdmin(u.id, u.is_admin)}
                                                style={{
                                                    padding: '4px 12px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, border: '1px solid',
                                                    background: u.is_admin ? 'rgba(255,215,0,0.12)' : 'rgba(90,200,250,0.06)',
                                                    color: u.is_admin ? '#FFD700' : '#5AC8FA',
                                                    borderColor: u.is_admin ? 'rgba(255,215,0,0.3)' : 'rgba(90,200,250,0.2)',
                                                    cursor: 'pointer',
                                                }}
                                                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                                                {u.is_admin ? '★ Admin' : 'User'}
                                            </motion.button>
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <motion.button onClick={() => deleteUser(u.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FF6B6B', fontWeight: 700, fontSize: '0.72rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
                                                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                                                <Trash2 size={11} />
                                            </motion.button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                </div>
            )}

            { }
            {tab === 'reports' && (
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h2 className="ios-title" style={{ fontSize: '0.9rem', marginBottom: 16 }}>All Assessments</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(90,200,250,0.08)' }}>
                                    {['Project', 'User ID', 'Score', 'Status', 'Date'].map(h => (
                                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(90,200,250,0.4)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <motion.tbody variants={listV} initial="hidden" animate="visible">
                                {reports.map(r => (
                                    <motion.tr key={r.id} variants={itemV}
                                        style={{ borderBottom: '1px solid rgba(90,200,250,0.03)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,200,250,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '10px 12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t1)', fontWeight: 600 }}>{r.source_value}</td>
                                        <td style={{ padding: '10px 12px', color: 'var(--t3)', fontSize: '0.7rem', fontFamily: 'JetBrains Mono,monospace' }}>{r.user_id?.slice(0, 10)}…</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ fontFamily: 'Orbitron,monospace', fontWeight: 900, color: SC[r.status] || '#5AC8FA' }}>{r.score}</span>
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: `${SC[r.status] || '#5AC8FA'}18`, color: SC[r.status] || '#5AC8FA', border: `1px solid ${SC[r.status] || '#5AC8FA'}35` }}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', color: 'var(--t3)', fontSize: '0.72rem' }}>
                                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
