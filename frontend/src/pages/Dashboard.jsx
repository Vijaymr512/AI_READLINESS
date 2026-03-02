import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, AlertTriangle, BarChart3, FolderGit2, Upload, Search,
    Trash2, Eye, RefreshCw, Filter, Zap, CheckCircle, TrendingUp, X
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, Cell, PieChart, Pie,
    ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import api from '../services/apiClient';
import sounds from '../utils/sound';

const SC = { Strong: '#00ff9d', Moderate: '#ffd700', Weak: '#ff8c00', Critical: '#ff4444' };

function StatCard({ label, value, icon: Icon, sublabel, variant = 1, loading }) {
    return (
        <motion.div
            className={`stat-card stat-card-${variant} hud-corners`}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onHoverStart={() => sounds.tick()}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)' }}>{label}</p>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,212,255,0.1)', display: 'grid', placeItems: 'center' }}>
                    <Icon size={15} style={{ color: 'var(--j-core)' }} className="icon-glow" />
                </div>
            </div>
            <motion.p
                key={value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 12, fontSize: '2.4rem', fontWeight: 900, fontFamily: 'Orbitron, monospace', color: 'var(--t0)', letterSpacing: '0.04em' }}
            >
                {loading ? '—' : value}
            </motion.p>
            {sublabel && <p style={{ marginTop: 4, fontSize: '0.7rem', color: 'var(--t3)' }}>{sublabel}</p>}
        </motion.div>
    );
}

function Spark({ data, color }) {
    return (
        <ResponsiveContainer width="100%" height={28}>
            <LineChart data={data}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}

const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(4,14,40,0.97)', border: '1px solid var(--border-hot)', borderRadius: 10, padding: '8px 14px', fontSize: '0.8rem' }}>
            <p style={{ color: 'var(--t3)', marginBottom: 3 }}>{label}</p>
            <p style={{ color: 'var(--j-core)', fontWeight: 800 }}>{payload[0].value}</p>
        </div>
    );
};

function ArcDecor({ size = 160, opacity = 0.35 }) {
    return (
        <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: size, height: size, opacity, pointerEvents: 'none' }}>
            {[1, 0.6, 0.35].map((o, i) => (
                <div key={i} style={{
                    position: 'absolute', inset: i * 22, borderRadius: '50%', border: '1.5px solid var(--j-core)', opacity: o,
                    animation: `arcSpin ${8 + i * 6}s linear infinite ${i % 2 ? 'reverse' : ''}`
                }} />
            ))}
            <div style={{ position: 'absolute', inset: '40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.6), transparent)', animation: 'arcCore 3s ease-in-out infinite' }} />
        </div>
    );
}

export default function Dashboard() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('date');
    const navigate = useNavigate();

    const load = useCallback(async () => {
        try {
            setError('');
            const { data } = await api.get('/user/dashboard');
            setAssessments(data.assessments || []);
        } catch { setError('Failed to load assessments.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); sounds.startup(); }, [load]);

    const stats = useMemo(() => {
        const total = assessments.length;
        const avg = total ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / total) : 0;
        const weak = assessments.filter(a => ['Critical', 'Weak'].includes(a.status)).length;
        const strong = assessments.filter(a => a.status === 'Strong').length;
        const latest = assessments[0]?.score ?? 0;
        return { total, avg, weak, strong, latest };
    }, [assessments]);

    const filtered = useMemo(() => {
        let list = [...assessments];
        if (search) list = list.filter(a => a.source_value?.toLowerCase().includes(search.toLowerCase()));
        if (filterStatus !== 'All') list = list.filter(a => a.status === filterStatus);
        if (sortBy === 'score-asc') list.sort((a, b) => a.score - b.score);
        if (sortBy === 'score-desc') list.sort((a, b) => b.score - a.score);
        if (sortBy === 'date') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return list;
    }, [assessments, search, filterStatus, sortBy]);

    const trendData = useMemo(() =>
        [...assessments].slice(0, 12).reverse().map((a, i) => ({ run: `R${i + 1}`, score: a.score })),
        [assessments]);

    const statusDist = useMemo(() => {
        const m = { Strong: 0, Moderate: 0, Weak: 0, Critical: 0 };
        assessments.forEach(a => m[a.status] = (m[a.status] || 0) + 1);
        return Object.entries(m).map(([name, value]) => ({ name, value }));
    }, [assessments]);

    const layerAvgs = useMemo(() => {
        if (!assessments.length) return [];
        const keys = Object.keys(assessments[0]?.layer_scores || {});
        return keys.map(k => ({
            name: k.replace(/_/g, ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ').slice(0, 12),
            score: Math.round(assessments.reduce((s, a) => s + (a.layer_scores?.[k] || 0), 0) / assessments.length),
        })).sort((a, b) => a.score - b.score);
    }, [assessments]);

    const sparkOf = (a) => {
        const vals = Object.values(a.layer_scores || {});
        return vals.map((v, i) => ({ v }));
    };

    const toggleSelect = (id) => {
        sounds.tick();
        setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    };

    const deleteOne = async (id) => {
        sounds.click();
        if (!confirm('Delete this report?')) return;
        await api.delete(`/report/${id}`);
        setSelected(p => p.filter(x => x !== id));
        load();
    };

    const deleteSelected = async () => {
        sounds.error();
        if (!selected.length || !confirm(`Delete ${selected.length} reports?`)) return;
        setDeleting(true);
        try { await api.post('/report/bulk-delete', { ids: selected }); setSelected([]); load(); }
        finally { setDeleting(false); }
    };

    const statusTone = (s) => ({
        Strong: 'rgba(0,255,157,0.1)', Moderate: 'rgba(255,215,0,0.1)',
        Weak: 'rgba(255,140,0,0.1)', Critical: 'rgba(255,68,68,0.1)',
    }[s] || 'rgba(255,255,255,0.03)');

    const listVariants = {
        hidden: {}, visible: { transition: { staggerChildren: 0.06 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 24 } },
    };

    return (
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            { }
            <div className="glass-panel hud-corners" style={{ padding: '22px 28px', position: 'relative', overflow: 'hidden', minHeight: 100 }}>
                <ArcDecor size={140} opacity={0.28} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--j-green)', boxShadow: '0 0 8px var(--j-green)', animation: 'statusBlink 3s infinite' }} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--j-green)', textTransform: 'uppercase' }}>Systems Online</span>
                    </div>
                    <h1 className="hud-title gradient-text" style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.04em', marginBottom: 4 }}>
                        App Reader Dashboard
                    </h1>
                    <p style={{ color: 'var(--t3)', fontSize: '0.82rem' }}>9-Layer AI readiness intelligence across all analysed projects.</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: 'var(--j-red)', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            { }
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}
                variants={listVariants} initial="hidden" animate="visible"
            >
                {[
                    { label: 'Assessments', value: stats.total, icon: FolderGit2, sublabel: 'Total runs', v: 1 },
                    { label: 'Avg Score', value: stats.avg, icon: BarChart3, sublabel: 'Across all', v: 2 },
                    { label: 'Needs Fix', value: stats.weak, icon: AlertTriangle, sublabel: 'Weak/Critical', v: 3 },
                    { label: 'AI-Ready', value: stats.strong, icon: CheckCircle, sublabel: 'Strong (80+)', v: 4 },
                ].map((s, i) => (
                    <motion.div key={i} variants={itemVariants}>
                        <StatCard {...s} variant={s.v} loading={loading} />
                    </motion.div>
                ))}
            </motion.div>

            { }
            {assessments.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 14 }}>
                    { }
                    <div className="glass-panel" style={{ padding: 22 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <h2 className="ios-title" style={{ fontSize: '0.9rem' }}>Score Trend</h2>
                            <span className="chip chip-cyan">{trendData.length} runs</span>
                        </div>
                        <div style={{ height: 170 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
                                    <XAxis dataKey="run" tick={{ fontSize: 9 }} stroke="var(--t4)" />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="var(--t4)" />
                                    <Tooltip content={<Tip />} />
                                    <Line type="monotone" dataKey="score" stroke="var(--j-core)" strokeWidth={2}
                                        dot={{ fill: 'var(--j-core)', r: 3 }}
                                        activeDot={{ r: 6, fill: 'var(--j-core)', boxShadow: '0 0 10px var(--j-core)' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    { }
                    <div className="glass-panel" style={{ padding: 22 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.9rem', marginBottom: 14 }}>Status Mix</h2>
                        <div style={{ height: 120 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusDist} dataKey="value" innerRadius={38} outerRadius={56} paddingAngle={3}>
                                        {statusDist.map(e => <Cell key={e.name} fill={SC[e.name]} />)}
                                    </Pie>
                                    <Tooltip content={<Tip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 8 }}>
                            {statusDist.map(s => (
                                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--t2)' }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: SC[s.name], flexShrink: 0 }} />
                                    {s.name}: <strong style={{ color: 'var(--t1)' }}>{s.value}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    { }
                    <div className="glass-panel" style={{ padding: 22 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.9rem', marginBottom: 14 }}>Layer Averages</h2>
                        <div style={{ height: 170 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={layerAvgs} layout="vertical" margin={{ left: 0, right: 8 }}>
                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8 }} stroke="var(--t4)" />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} stroke="var(--t4)" width={64} />
                                    <Tooltip content={<Tip />} />
                                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                                        {layerAvgs.map((e, i) => {
                                            const c = e.score >= 70 ? 'var(--j-green)' : e.score >= 50 ? 'var(--j-gold)' : 'var(--j-red)';
                                            return <Cell key={i} fill={c} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            { }
            {!loading && assessments.length === 0 && (
                <motion.div className="glass-panel hud-corners" style={{ padding: '48px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <ArcDecor size={200} opacity={0.2} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,212,255,0.2),transparent)', border: '2px solid rgba(0,212,255,0.3)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', animation: 'arcCore 2.5s ease-in-out infinite' }}>
                            <Zap size={28} style={{ color: 'var(--j-core)' }} className="icon-float" />
                        </div>
                        <h3 className="hud-title" style={{ fontSize: '1.1rem', color: 'var(--j-core)', marginBottom: 8 }}>No Assessments Yet</h3>
                        <p style={{ color: 'var(--t3)', marginBottom: 24, fontSize: '0.85rem' }}>Upload a project to run your first 9-layer AI readiness analysis</p>
                        <Link to="/upload">
                            <motion.button className="btn-jarvis btn-jarvis-primary" style={{ padding: '13px 36px' }}
                                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.96 }}
                                onClick={() => sounds.launch()}>
                                <Upload size={16} /> Upload Project
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            )}

            { }
            {assessments.length > 0 && (
                <div className="glass-panel" style={{ padding: 22 }}>
                    { }
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.95rem' }}>
                            All Reports
                            {filtered.length !== assessments.length && (
                                <span className="chip chip-cyan" style={{ marginLeft: 8, fontSize: '0.62rem' }}>{filtered.length}/{assessments.length}</span>
                            )}
                        </h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            { }
                            <div style={{ position: 'relative' }}>
                                <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                                <input
                                    value={search}
                                    onChange={e => { sounds.type(); setSearch(e.target.value); }}
                                    placeholder="Search..."
                                    className="input-jarvis"
                                    style={{ padding: '7px 10px 7px 28px', width: 180, borderRadius: 10, fontSize: '0.78rem' }}
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0 }}>
                                        <X size={11} />
                                    </button>
                                )}
                            </div>

                            { }
                            <select value={filterStatus} onChange={e => { sounds.click(); setFilterStatus(e.target.value); }}
                                style={{ padding: '7px 10px', borderRadius: 10, background: 'rgba(0,212,255,0.05)', border: '1px solid var(--border-dim)', color: 'var(--t1)', fontSize: '0.78rem', cursor: 'pointer', outline: 'none' }}>
                                {['All', 'Strong', 'Moderate', 'Weak', 'Critical'].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>

                            { }
                            <select value={sortBy} onChange={e => { sounds.click(); setSortBy(e.target.value); }}
                                style={{ padding: '7px 10px', borderRadius: 10, background: 'rgba(0,212,255,0.05)', border: '1px solid var(--border-dim)', color: 'var(--t1)', fontSize: '0.78rem', cursor: 'pointer', outline: 'none' }}>
                                <option value="date">Latest First</option>
                                <option value="score-desc">Highest Score</option>
                                <option value="score-asc">Lowest Score</option>
                            </select>

                            { }
                            <motion.button onClick={() => { sounds.click(); load(); }}
                                style={{ padding: '7px 10px', borderRadius: 10, background: 'rgba(0,212,255,0.05)', border: '1px solid var(--border-dim)', color: 'var(--j-core)', cursor: 'pointer' }}
                                whileHover={{ scale: 1.08 }} whileTap={{ rotate: 180, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                <RefreshCw size={13} />
                            </motion.button>

                            { }
                            <button className="chip chip-cyan" style={{ cursor: 'pointer', border: 'none', background: 'rgba(0,212,255,0.08)' }}
                                onClick={() => { sounds.tick(); setSelected(p => p.length === assessments.length ? [] : assessments.map(a => a.id)); }}>
                                {selected.length === assessments.length ? 'Deselect' : 'Select All'}
                            </button>

                            { }
                            <AnimatePresence>
                                {selected.length > 0 && (
                                    <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={deleteSelected} disabled={deleting}
                                        style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)', color: 'var(--j-red)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Trash2 size={12} /> Delete ({selected.length})
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    { }
                    <div className="ios-table-wrap">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
                                    {['', 'Project', 'Score', 'Status', 'Layers', 'Date', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t4)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <motion.tbody variants={listVariants} initial="hidden" animate="visible">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--t3)' }}>No results match your filter.</td></tr>
                                ) : filtered.map((item) => (
                                    <motion.tr key={item.id} variants={itemVariants}
                                        style={{ borderBottom: '1px solid rgba(0,212,255,0.035)', transition: 'background 150ms' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.03)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                        { }
                                        <td style={{ padding: '10px 12px' }}>
                                            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)}
                                                style={{ accentColor: 'var(--j-core)', cursor: 'pointer', width: 14, height: 14 }} />
                                        </td>
                                        { }
                                        <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <p style={{ color: 'var(--t1)', fontWeight: 600, fontSize: '0.82rem' }}>{item.source_value}</p>
                                            <p style={{ color: 'var(--t4)', fontSize: '0.65rem', marginTop: 2 }}>{item.source_type?.toUpperCase()}</p>
                                        </td>
                                        { }
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ fontFamily: 'Orbitron,monospace', fontWeight: 900, fontSize: '1rem', color: SC[item.status] || 'var(--j-core)' }}>{item.score}</span>
                                        </td>
                                        { }
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: statusTone(item.status), color: SC[item.status], border: `1px solid ${SC[item.status]}40`, letterSpacing: '0.06em' }}>{item.status}</span>
                                        </td>
                                        { }
                                        <td style={{ padding: '10px 12px', minWidth: 80 }}>
                                            <Spark data={sparkOf(item)} color={SC[item.status] || 'var(--j-core)'} />
                                        </td>
                                        { }
                                        <td style={{ padding: '10px 12px', color: 'var(--t3)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        { }
                                        <td style={{ padding: '10px 12px' }}>
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                <motion.button onClick={() => { sounds.click(); navigate(`/report/${item.id}`); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--j-core)', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
                                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                                                    <Eye size={11} /> View
                                                </motion.button>
                                                <motion.button onClick={() => deleteOne(item.id)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--j-red)', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
                                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                                                    <Trash2 size={11} />
                                                </motion.button>
                                            </div>
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
