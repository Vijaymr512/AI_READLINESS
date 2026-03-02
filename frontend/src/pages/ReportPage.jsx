import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Shield, GitBranch, Code, Package, TestTube,
    Zap, AlertTriangle, Eye, Activity, CheckCircle, XCircle,
    TrendingUp, Info, ChevronDown, ChevronRight, Cpu, Globe,
    Download, FileText, FileJson, FilePen
} from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import api from '../services/apiClient';

const STATUS_COLORS = {
    Strong: '#22d3ee', Moderate: '#fbbf24', Weak: '#f97316', Critical: '#f43f5e'
};
const VERDICT_STYLE = {
    good: { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)', color: '#22d3ee', label: '✅ Healthy' },
    warning: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', color: '#fbbf24', label: '⚠️ Needs Work' },
    critical: { bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', color: '#f43f5e', label: '⛔ Critical' },
};
const LAYER_ICONS = {
    static_rules: Shield, import_graph: GitBranch, ast_metrics: Code,
    dependencies: Package, test_coverage: TestTube, api_quality: Zap,
    tech_debt: AlertTriangle, env_maturity: Eye, observability: Activity,
};
const LAYER_COLORS = {
    static_rules: '#00e5ff', import_graph: '#a855f7', ast_metrics: '#22d3ee',
    dependencies: '#f97316', test_coverage: '#22c55e', api_quality: '#ec4899',
    tech_debt: '#fbbf24', env_maturity: '#3b82f6', observability: '#8b5cf6',
};

function ScoreRing({ score, status }) {
    const color = STATUS_COLORS[status] || '#a855f7';
    const r = 72; const C = 2 * Math.PI * r;
    const dash = (score / 100) * C;
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = () => {
            start += 2;
            setCount(Math.min(start, score));
            if (start < score) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [score]);

    return (
        <div style={{ position: 'relative', width: 190, height: 190, flexShrink: 0 }}>
            { }
            {[0, 1, 2].map(i => (
                <motion.div key={i}
                    style={{ position: 'absolute', inset: -(i * 12), borderRadius: '50%', border: `1px solid ${color}`, opacity: 0 }}
                    animate={{ opacity: [0, 0.2 - i * 0.06, 0], scale: [1, 1.05 + i * 0.03, 1] }}
                    transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
                />
            ))}
            <svg width="190" height="190" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="95" cy="95" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                <motion.circle
                    cx="95" cy="95" r={r} fill="none" stroke={color}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={C}
                    initial={{ strokeDashoffset: C }}
                    animate={{ strokeDashoffset: C - dash }}
                    transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 30px ${color}80)` }}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '2.6rem', fontWeight: 900, color, lineHeight: 1 }}
                    animate={{ opacity: [0, 1] }} transition={{ duration: 0.8 }}>
                    {count}
                </motion.span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.14em', marginTop: 2 }}>/ 100</span>
                <span style={{ marginTop: 6, fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color, background: `${color}18`, padding: '3px 10px', borderRadius: 999, border: `1px solid ${color}40` }}>
                    {status}
                </span>
            </div>
        </div>
    );
}

function LayerCard({ name, data, idx }) {
    const [open, setOpen] = useState(false);
    const Icon = LAYER_ICONS[name] || Cpu;
    const color = LAYER_COLORS[name] || '#a855f7';
    const vStyle = VERDICT_STYLE[data.verdict] || VERDICT_STYLE.warning;
    const score = data.score;
    const pct = `${score}%`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className="layer-card"
            style={{ borderColor: open ? `${color}40` : undefined }}
        >
            { }
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '999px 0 0 999px', boxShadow: `0 0 8px ${color}` }} />

            { }
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', paddingLeft: 8 }} onClick={() => setOpen(o => !o)}>
                { }
                <motion.div
                    style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}30`, display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, transparent 60%)', borderRadius: 'inherit' }} />
                    <Icon size={18} style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} className="icon-glow" />
                </motion.div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '0.01em' }}>{data.title}</span>
                            <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, fontSize: '0.6rem', fontWeight: 800, background: vStyle.bg, border: `1px solid ${vStyle.border}`, color: vStyle.color }}>
                                {vStyle.label}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '1rem', color }}>{score}</span>
                            <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronRight size={14} style={{ color: 'var(--t3)' }} />
                            </motion.div>
                        </div>
                    </div>
                    { }
                    <div className="progress-bar-wrap">
                        <motion.div
                            className="progress-bar"
                            style={{ background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 8px ${color}60` }}
                            initial={{ width: 0 }} animate={{ width: pct }} transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.08 }}
                        />
                    </div>
                </div>
            </div>

            { }
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden', marginTop: 14, paddingLeft: 8 }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            { }
                            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>
                                    <Info size={10} style={{ display: 'inline', marginRight: 5 }} />What This Measures
                                </p>
                                <p style={{ fontSize: '0.83rem', color: 'var(--t2)', lineHeight: 1.7 }}>{data.description}</p>
                            </div>

                            { }
                            <div style={{ padding: '12px 14px', borderRadius: 12, background: vStyle.bg, border: `1px solid ${vStyle.border}` }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: vStyle.color, marginBottom: 6 }}>Analysis Result</p>
                                <p style={{ fontSize: '0.83rem', color: 'var(--t1)', lineHeight: 1.7 }}>{data.analysis_text}</p>
                            </div>

                            { }
                            {Object.keys(data.data || {}).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {Object.entries(data.data).map(([k, v]) => (
                                        <div key={k} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <p style={{ fontSize: '0.6rem', color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{k.replace(/_/g, ' ')}</p>
                                            <p style={{ fontSize: '0.82rem', fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
                                                {typeof v === 'boolean' ? (v ? '✅ Yes' : '❌ No') : String(v)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CapPill({ label }) {
    return (
        <motion.div
            className="chip chip-green"
            style={{ fontSize: '0.72rem', fontWeight: 700 }}
            whileHover={{ scale: 1.06, y: -2 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
        >
            <CheckCircle size={10} style={{ flexShrink: 0 }} />
            {label}
        </motion.div>
    );
}

function MiniStat({ label, value, color = 'var(--t1)', mono = false }) {
    return (
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--t3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</p>
            <p style={{ fontSize: '0.92rem', fontWeight: 800, color, fontFamily: mono ? 'JetBrains Mono, monospace' : undefined }}>{value ?? '—'}</p>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(13,5,32,0.97)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: '8px 14px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--t2)', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#a855f7' }}>{payload[0].value}</p>
        </div>
    );
};

export default function ReportPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [dlOpen, setDlOpen] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    useEffect(() => {
        api.get(`/report/${id}`)
            .then(r => setReport(r.data))
            .catch(() => setErr('Report not found or access denied.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
            <motion.div style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid rgba(168,85,247,0.15)', borderTopColor: '#a855f7' }}
                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
        </div>
    );
    if (err) return (
        <div className="glass-panel" style={{ padding: 32, textAlign: 'center', maxWidth: 500, margin: '60px auto' }}>
            <XCircle size={40} style={{ color: '#f43f5e', margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: '#f43f5e', fontWeight: 700 }}>{err}</p>
            <button onClick={() => navigate('/dashboard')} style={{ marginTop: 18, color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>← Back</button>
        </div>
    );

    const { score, status, executive_summary, layer_scores = {}, layer_analysis = {},
        capabilities = {}, improvement_diagnostics = [], why_not_80 = [], blockers = [],
        project_profile = {}, score_details = {}, risk_register = [], risks = [] } = report;

    const statusColor = STATUS_COLORS[status] || '#a855f7';
    const capList = Object.keys(capabilities).filter(k => capabilities[k]);
    const layerEntries = Object.entries(layer_scores);
    const radarData = layerEntries.map(([k, v]) => ({
        subject: (layer_analysis[k]?.title || k).replace(' Analysis', '').replace(' & Standards', '').replace(' & Complexity', ''),
        score: v, fullMark: 100,
    }));
    const barData = [...layerEntries].sort((a, b) => a[1] - b[1]).map(([k, v]) => ({
        name: (layer_analysis[k]?.title || k).split(' ')[0],
        score: v, fill: LAYER_COLORS[k] || '#a855f7',
    }));

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'layers', label: '9-Layer Analysis' },
        { id: 'diagnostics', label: 'Diagnostics' },
        { id: 'risks', label: 'Risk Register' },
        { id: 'profile', label: 'Project Profile' },
    ];

    return (
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            { }
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <motion.button onClick={() => navigate('/dashboard')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t2)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', paddingLeft: 0 }}
                    whileHover={{ x: -3 }}>
                    <ArrowLeft size={14} /> Dashboard
                </motion.button>

                { }
                <div style={{ position: 'relative' }}>
                    <motion.button
                        onClick={() => setDlOpen(o => !o)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <Download size={13} /> Export
                        <motion.span animate={{ rotate: dlOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={12} />
                        </motion.span>
                    </motion.button>
                    <AnimatePresence>
                        {dlOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{ position: 'absolute', right: 0, top: '110%', zIndex: 100, background: 'rgba(4,14,40,0.97)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 12, padding: 6, minWidth: 180, backdropFilter: 'blur(16px)' }}>
                                {[
                                    { label: 'Export as HTML / PDF', icon: FilePen, href: `${API_BASE}/report/${id}/download/html`, target: '_blank' },
                                    { label: 'Download JSON', icon: FileJson, href: `${API_BASE}/report/${id}/download/json`, target: '_self' },
                                    { label: 'Download Text', icon: FileText, href: `${API_BASE}/report/${id}/download/text`, target: '_self' },
                                ].map(({ label, icon: Icon, href, target }) => (
                                    <a key={label} href={href} target={target} rel="noopener noreferrer"
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, color: 'var(--t1)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.06)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => setDlOpen(false)}>
                                        <Icon size={13} style={{ color: '#22d3ee' }} /> {label}
                                    </a>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            { }
            <div className="glass-panel" style={{ padding: '28px 28px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            <span className={`chip chip-${score >= 70 ? 'cyan' : score >= 50 ? 'gold' : score >= 30 ? 'orange' : 'red'}`}>
                                <TrendingUp size={10} /> {status} Readiness
                            </span>
                            <span className="chip chip-violet">
                                <Globe size={10} /> {report.source_type?.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--t3)', alignSelf: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
                                {new Date(report.created_at).toLocaleString()}
                            </span>
                        </div>
                        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.5rem', fontWeight: 900, marginBottom: 8, lineHeight: 1.2 }} className="gradient-text">
                            AI Readiness Report
                        </h1>
                        <p style={{ fontSize: '0.78rem', color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 16, wordBreak: 'break-all' }}>
                            {report.source_value}
                        </p>
                        <p style={{ color: 'var(--t2)', fontSize: '0.86rem', lineHeight: 1.75, maxWidth: 580 }}>
                            {executive_summary}
                        </p>

                        { }
                        {blockers.length > 0 && (
                            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)' }}>
                                <p style={{ fontWeight: 800, color: '#f43f5e', marginBottom: 6, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>⛔ Hard Blockers</p>
                                {blockers.map((b, i) => <p key={i} style={{ color: '#f43f5e', fontSize: '0.81rem', opacity: 0.85 }}>• {b}</p>)}
                            </div>
                        )}

                        { }
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                            {Object.entries(report.gate_checks || {}).map(([k, v]) => (
                                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', padding: '4px 10px', borderRadius: 8, background: v ? 'rgba(34,211,238,0.06)' : 'rgba(244,63,94,0.06)', border: `1px solid ${v ? 'rgba(34,211,238,0.2)' : 'rgba(244,63,94,0.2)'}`, color: v ? '#22d3ee' : '#f43f5e', fontWeight: 700 }}>
                                    {v ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                    {k.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    </div>
                    <ScoreRing score={score} status={status} />
                </div>
            </div>

            { }
            <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
                {TABS.map(t => (
                    <motion.button key={t.id} onClick={() => setActiveTab(t.id)}
                        style={{
                            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.02em', transition: 'all 200ms',
                            background: activeTab === t.id ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'transparent',
                            color: activeTab === t.id ? 'white' : 'var(--t2)',
                            boxShadow: activeTab === t.id ? '0 4px 12px rgba(168,85,247,0.4)' : 'none',
                        }}
                        whileTap={{ scale: 0.95 }}>
                        {t.label}
                    </motion.button>
                ))}
            </div>

            { }
            {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    { }
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 16 }}>Layer Score Breakdown</h2>
                            <div style={{ height: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--t3)' }} width={60} />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--t3)' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                                            {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 16 }}>Readiness Radar</h2>
                            <div style={{ height: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="rgba(168,85,247,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8.5, fill: 'var(--t3)' }} />
                                        <Radar dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.12}
                                            dot={{ fill: '#a855f7', r: 3 }} />
                                        <Tooltip contentStyle={{ background: 'rgba(13,5,32,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 10, fontSize: '0.76rem' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 14 }}>
                            <CheckCircle size={15} style={{ display: 'inline', marginRight: 8, color: '#22d3ee' }} />Detected Capabilities ({capList.length})
                        </h2>
                        {capList.length === 0 ? (
                            <p style={{ color: 'var(--t3)', fontSize: '0.85rem' }}>No capabilities detected. Implement authentication, validation, and logging first.</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {capList.map(c => <CapPill key={c} label={c} />)}
                            </div>
                        )}
                    </div>

                    { }
                    {why_not_80.length > 0 && (
                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 14 }}>
                                🎯 Roadmap to AI-Ready (80+)
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {why_not_80.map((tip, i) => (
                                    <motion.div key={i} style={{
                                        display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 12,
                                        background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)'
                                    }}
                                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                                        <span style={{ color: '#a855f7', fontWeight: 900, fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>→</span>
                                        <p style={{ color: 'var(--t2)', fontSize: '0.84rem', lineHeight: 1.65 }}>{tip}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            { }
            {activeTab === 'layers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ color: 'var(--t3)', fontSize: '0.8rem', marginBottom: 4 }}>Click any layer to expand the descriptive analysis and data points.</p>
                    {layerEntries.map(([name], idx) => {
                        const la = layer_analysis[name];
                        if (!la) return null;
                        return <LayerCard key={name} name={name} data={la} idx={idx} />;
                    })}
                </div>
            )}

            { }
            {activeTab === 'diagnostics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {improvement_diagnostics.length === 0
                        ? <div className="glass-panel" style={{ padding: 32, textAlign: 'center' }}><CheckCircle size={32} style={{ color: '#22d3ee', margin: '0 auto 12px', display: 'block' }} /><p style={{ color: '#22d3ee', fontWeight: 700 }}>All layers are healthy!</p></div>
                        : improvement_diagnostics.map((d, i) => (
                            <motion.div key={i} className="glass-panel" style={{ padding: 22, borderLeft: `3px solid ${d.priority === 'critical' ? '#f43f5e' : d.priority === 'high' ? '#f97316' : '#fbbf24'}` }}
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: '1.1rem' }}>{d.icon}</span>
                                        <div>
                                            <p style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--t1)' }}>{d.layer}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--t3)', marginTop: 2 }}>Effort: {d.effort}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '0.9rem', color: d.score >= 50 ? '#fbbf24' : '#f43f5e' }}>{d.score}/100</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: d.priority === 'critical' ? 'rgba(244,63,94,0.12)' : d.priority === 'high' ? 'rgba(249,115,22,0.12)' : 'rgba(251,191,36,0.12)', color: d.priority === 'critical' ? '#f43f5e' : d.priority === 'high' ? '#f97316' : '#fbbf24', border: `1px solid ${d.priority === 'critical' ? 'rgba(244,63,94,0.3)' : d.priority === 'high' ? 'rgba(249,115,22,0.3)' : 'rgba(251,191,36,0.3)'}`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            {d.priority}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ color: 'var(--t2)', fontSize: '0.84rem', lineHeight: 1.72 }}>{d.tip}</p>
                            </motion.div>
                        ))
                    }
                </div>
            )}

            { }
            {activeTab === 'risks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(risk_register.length > 0 ? risk_register : risks).length === 0
                        ? <div className="glass-panel" style={{ padding: 32, textAlign: 'center' }}><Shield size={32} style={{ color: '#22d3ee', margin: '0 auto 12px', display: 'block' }} /><p style={{ color: '#22d3ee', fontWeight: 700 }}>No risks detected!</p></div>
                        : (risk_register.length > 0 ? risk_register : risks).map((r, i) => (
                            <motion.div key={i} className="glass-panel" style={{ padding: 22 }}
                                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                    <p style={{ fontWeight: 800, color: 'var(--t1)', fontSize: '0.88rem' }}>{r.name}</p>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                                            background: r.severity === 'critical' ? 'rgba(244,63,94,0.15)' : r.severity === 'high' ? 'rgba(249,115,22,0.15)' : 'rgba(251,191,36,0.12)',
                                            color: r.severity === 'critical' ? '#f43f5e' : r.severity === 'high' ? '#f97316' : '#fbbf24',
                                            border: `1px solid ${r.severity === 'critical' ? 'rgba(244,63,94,0.3)' : 'rgba(249,115,22,0.3)'}`,
                                        }}>{r.severity?.toUpperCase()}</span>
                                        <span className="chip chip-violet" style={{ fontSize: '0.65rem' }}>{r.category}</span>
                                    </div>
                                </div>
                                {r.description && <p style={{ color: 'var(--t2)', fontSize: '0.83rem', lineHeight: 1.7, marginBottom: 10 }}>{r.description}</p>}
                                {r.impact && (
                                    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', marginBottom: 8 }}>
                                        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f97316', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Impact</p>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--t2)', lineHeight: 1.65 }}>{r.impact}</p>
                                    </div>
                                )}
                                {r.remediation && (
                                    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.12)' }}>
                                        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#22d3ee', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Remediation</p>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--t2)', lineHeight: 1.65 }}>{r.remediation}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    }
                </div>
            )}

            { }
            {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    { }
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 16 }}>Project Overview</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                            <MiniStat label="Primary Language" value={project_profile.primary_language} color="var(--g-cyan)" />
                            <MiniStat label="Total Files" value={project_profile.total_files} color="var(--g-violet)" />
                            <MiniStat label="Docker" value={project_profile.has_docker ? '✅ Present' : '❌ Missing'} color={project_profile.has_docker ? '#22c55e' : '#f43f5e'} />
                            <MiniStat label="CI/CD" value={project_profile.has_cicd ? '✅ Present' : '❌ Missing'} color={project_profile.has_cicd ? '#22c55e' : '#f43f5e'} />
                            <MiniStat label="Lang Diversity" value={`${project_profile.language_diversity} language${project_profile.language_diversity !== 1 ? 's' : ''}`} color="var(--g-gold)" />
                        </div>
                        {project_profile.stack?.length > 0 && (
                            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {project_profile.stack.map(s => <span key={s} className="chip chip-violet">{s}</span>)}
                            </div>
                        )}
                    </div>

                    { }
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 16 }}>Code Metrics</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                            <MiniStat label="Functions" value={score_details.total_functions} color="var(--g-cyan)" mono />
                            <MiniStat label="Classes" value={score_details.total_classes} color="var(--g-violet)" mono />
                            <MiniStat label="Comment Density" value={`${Math.round((score_details.comment_density || 0) * 100)}%`} color={score_details.comment_density > 0.1 ? '#22c55e' : '#fbbf24'} mono />
                            <MiniStat label="High Complexity" value={score_details.high_complexity} color={score_details.high_complexity > 5 ? '#f43f5e' : '#22c55e'} mono />
                            <MiniStat label="Dead Imports" value={score_details.dead_imports} color={score_details.dead_imports > 0 ? '#fbbf24' : '#22c55e'} mono />
                        </div>
                    </div>

                    { }
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 14 }}>Test Details</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <MiniStat label="Test Files" value={score_details.test_files} />
                                <MiniStat label="Source Files" value={score_details.source_files} />
                                <MiniStat label="Test Ratio" value={`${Math.round((score_details.test_ratio || 0) * 100)}%`} color={score_details.test_ratio > 0.15 ? '#22c55e' : '#f43f5e'} mono />
                                <MiniStat label="Assertions Found" value={score_details.assertion_count} />
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 14 }}>Dependency Health</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <MiniStat label="Total Dependencies" value={score_details.total_dependencies} />
                                <MiniStat label="Unpinned" value={score_details.unpinned_deps} color={score_details.unpinned_deps > 0 ? '#f97316' : '#22c55e'} mono />
                                <MiniStat label="Deprecated" value={score_details.deprecated_deps?.length || 0} color={(score_details.deprecated_deps?.length || 0) > 0 ? '#f43f5e' : '#22c55e'} mono />
                                <MiniStat label="Risky Packages" value={score_details.risky_deps?.length || 0} color={(score_details.risky_deps?.length || 0) > 0 ? '#fbbf24' : '#22c55e'} mono />
                            </div>
                        </div>
                    </div>

                    { }
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 14 }}>Observability</h2>
                            {[
                                { label: 'Structured Logging', val: score_details.has_logging },
                                { label: 'Health Endpoint', val: score_details.has_health_check },
                                { label: 'Metrics Collection', val: score_details.has_metrics },
                                { label: 'Error Tracking', val: score_details.has_error_tracking },
                            ].map(({ label, val }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--t2)' }}>{label}</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: val ? '#22d3ee' : '#f43f5e' }}>{val ? '✅' : '❌'}</span>
                                </div>
                            ))}
                        </div>
                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h2 className="ios-title" style={{ fontSize: '0.95rem', marginBottom: 14 }}>Environment & Debt</h2>
                            {[
                                { label: 'Uses Env Vars', val: score_details.uses_env_vars },
                                { label: '.env.example', val: score_details.has_env_example },
                                { label: 'Hardcoded Localhost', val: score_details.has_hardcoded_localhost, invert: true },
                                { label: 'API Versioning', val: score_details.has_api_versioning },
                                { label: 'OpenAPI Docs', val: score_details.has_openapi_docs },
                            ].map(({ label, val, invert }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--t2)' }}>{label}</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: (invert ? !val : val) ? '#22d3ee' : '#f43f5e' }}>{val ? (invert ? '❌' : '✅') : (invert ? '✅' : '❌')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
