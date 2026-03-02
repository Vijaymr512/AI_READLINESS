import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { CloudUpload, GitBranch, CheckCircle, AlertTriangle, Cpu, RefreshCw } from 'lucide-react';
import sounds from '../utils/sound';

const STAGES = [
    { key: 'ingest', emoji: '🔍', label: 'Reading Files', estSecs: 5 },
    { key: 'classify', emoji: '🧬', label: 'Classifying Stack', estSecs: 3 },
    { key: 'rules', emoji: '🛡️', label: 'Static Rules (56)', estSecs: 20 },
    { key: 'graph', emoji: '🔗', label: 'Import Graph', estSecs: 8 },
    { key: 'ast', emoji: '🔬', label: 'AST Metrics', estSecs: 10 },
    { key: 'deps', emoji: '📦', label: 'Dependency Risk', estSecs: 4 },
    { key: 'tests', emoji: '🧪', label: 'Test Coverage', estSecs: 4 },
    { key: 'api', emoji: '⚡', label: 'API Quality', estSecs: 4 },
    { key: 'debt', emoji: '⚠️', label: 'Technical Debt', estSecs: 4 },
    { key: 'env', emoji: '⚙️', label: 'Env Maturity', estSecs: 3 },
    { key: 'obs', emoji: '📡', label: 'Observability', estSecs: 3 },
    { key: 'score', emoji: '🧮', label: 'Score Fusion', estSecs: 2 },
    { key: 'report', emoji: '📋', label: 'Building Report', estSecs: 3 },
    { key: 'done', emoji: '✅', label: 'Complete', estSecs: 0 },
];
const TOTAL_EST = STAGES.reduce((s, st) => s + st.estSecs, 0);

const RING_R = 96;
const RING_SZ = 220;
const RING_C = 2 * Math.PI * RING_R;
const NUM_DOTS = 24;
const TAU = 2 * Math.PI;

function useStopwatch(running) {
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (running) {
            startRef.current = Date.now() - elapsed * 1000;
            const tick = () => {
                setElapsed((Date.now() - startRef.current) / 1000);
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        } else {
            cancelAnimationFrame(rafRef.current);
        }
        return () => cancelAnimationFrame(rafRef.current);

    }, [running]);

    const reset = () => { setElapsed(0); startRef.current = null; };
    return { elapsed, reset };
}

function fmtTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m > 0 ? m + 'm ' : ''}${s}s`;
}

function ArcReactor({ progress, stageMsg, stageIdx, elapsed }) {
    const canvasRef = useRef(null);
    const angleRef = useRef(0);
    const glowRef = useRef(0);

    useAnimationFrame((_, delta) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;

        angleRef.current += (delta / 1000) * 0.9;
        glowRef.current += (delta / 1000) * 1.8;

        ctx.save();
        ctx.strokeStyle = 'rgba(0,212,255,0.6)';
        ctx.lineWidth = 4; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 18;
        ctx.beginPath();
        const sa = glowRef.current;
        ctx.arc(cx, cy, RING_R + 12, sa - 0.5, sa + 0.5);
        ctx.stroke(); ctx.restore();

        for (let i = 0; i < NUM_DOTS; i++) {
            const a = angleRef.current + (i / NUM_DOTS) * TAU;
            const x = cx + Math.cos(a) * (RING_R + 12);
            const y = cy + Math.sin(a) * (RING_R + 12);
            const progA = (progress / 100) * TAU - TAU / 4;
            const dotA = (i / NUM_DOTS) * TAU - TAU / 4;
            const active = dotA <= progA;
            ctx.save();
            ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = active ? 10 : 0;
            ctx.fillStyle = `rgba(0,212,255,${active ? 0.85 : 0.12})`;
            ctx.beginPath(); ctx.arc(x, y, active ? 3.5 : 2, 0, TAU); ctx.fill();
            ctx.restore();
        }

        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
        ctx.save();
        ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 30 + pulse * 20;
        ctx.fillStyle = `rgba(0,212,255,${0.4 + pulse * 0.5})`;
        ctx.beginPath(); ctx.arc(cx, cy, 6 + pulse * 4, 0, TAU); ctx.fill();
        ctx.restore();
    });

    const dashOffset = RING_C - (progress / 100) * RING_C;
    const currentStage = STAGES[stageIdx] || STAGES[0];

    const completedEst = STAGES.slice(0, stageIdx).reduce((s, st) => s + st.estSecs, 0);
    const remainingEst = Math.max(0, TOTAL_EST - completedEst);
    const eta = remainingEst > 0 ? `~${fmtTime(remainingEst)} left` : 'Finishing up…';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

            { }
            <div style={{ position: 'relative', width: RING_SZ, height: RING_SZ }}>
                <canvas ref={canvasRef} width={RING_SZ} height={RING_SZ} style={{ position: 'absolute', inset: 0 }} />

                { }
                {[RING_SZ + 20, RING_SZ + 46, RING_SZ + 72].map((s, i) => (
                    <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2, borderRadius: '50%', border: `1px solid rgba(0,212,255,${0.06 - i * 0.015})`, animation: `arcSpin ${22 + i * 14}s linear infinite ${i % 2 ? 'reverse' : ''}` }} />
                ))}

                { }
                <svg style={{ position: 'absolute', inset: 0 }} width={RING_SZ} height={RING_SZ} viewBox={`0 0 ${RING_SZ} ${RING_SZ}`}>
                    {Array.from({ length: 60 }).map((_, i) => {
                        const a = (i / 60) * TAU - TAU / 4;
                        const inner = RING_R + 18, outer = RING_R + 22 + (i % 5 === 0 ? 4 : 0);
                        const cx = RING_SZ / 2, cy = RING_SZ / 2;
                        return <line key={i} x1={cx + Math.cos(a) * inner} y1={cy + Math.sin(a) * inner} x2={cx + Math.cos(a) * outer} y2={cy + Math.sin(a) * outer} stroke={`rgba(0,212,255,${i % 5 === 0 ? 0.35 : 0.12})`} strokeWidth={i % 5 === 0 ? 1.5 : 0.8} />;
                    })}
                </svg>

                { }
                <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} width={RING_SZ} height={RING_SZ} viewBox={`0 0 ${RING_SZ} ${RING_SZ}`}>
                    <defs>
                        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#00d4ff" /><stop offset="50%" stopColor="#5AC8FA" /><stop offset="100%" stopColor="#9d4edd" />
                        </linearGradient>
                        <filter id="arcGlow"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    </defs>
                    <circle cx={RING_SZ / 2} cy={RING_SZ / 2} r={RING_R} fill="none" stroke="rgba(0,212,255,0.06)" strokeWidth="10" />
                    <motion.circle cx={RING_SZ / 2} cy={RING_SZ / 2} r={RING_R} fill="none" stroke="url(#arcGrad)" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={RING_C} initial={{ strokeDashoffset: RING_C }} animate={{ strokeDashoffset: dashOffset }} transition={{ duration: 0.9, ease: 'easeOut' }} filter="url(#arcGlow)" />
                </svg>

                { }
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <motion.span key={progress} initial={{ scale: 0.7, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        style={{ fontFamily: 'Orbitron,monospace', fontSize: '2.8rem', fontWeight: 900, background: 'linear-gradient(135deg,#00d4ff,#9d4edd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.8))' }}>
                        {progress}
                    </motion.span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(0,212,255,0.55)' }}>%</span>
                    <span style={{ fontSize: '1.4rem', marginTop: 4 }}>{currentStage.emoji}</span>
                </div>
            </div>

            { }
            <motion.div key={stageMsg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ textAlign: 'center', marginTop: 8 }}>
                <p style={{ fontFamily: 'Orbitron,monospace', fontSize: '0.68rem', letterSpacing: '0.2em', color: 'var(--j-core)', fontWeight: 700, marginBottom: 4 }}>
                    {currentStage.label.toUpperCase()}
                </p>
                <p style={{ color: 'var(--t2)', fontSize: '0.84rem', maxWidth: 280, lineHeight: 1.4 }}>
                    {stageMsg || 'Starting analysis engine…'}
                </p>
            </motion.div>

            { }
            <div style={{ display: 'flex', gap: 24, marginTop: 16, justifyContent: 'center' }}>
                { }
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--t4)', textTransform: 'uppercase', marginBottom: 3 }}>Elapsed</p>
                    <motion.p key={Math.floor(elapsed)} style={{ fontFamily: 'Orbitron,monospace', fontSize: '1rem', fontWeight: 900, color: 'var(--j-core)' }}>
                        {fmtTime(elapsed)}
                    </motion.p>
                </div>
                { }
                <div style={{ width: 1, background: 'var(--border-dim)', alignSelf: 'stretch' }} />
                { }
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--t4)', textTransform: 'uppercase', marginBottom: 3 }}>Estimated</p>
                    <motion.p key={stageIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: 'Orbitron,monospace', fontSize: '1rem', fontWeight: 900, color: 'var(--j-gold, #FFD700)' }}>
                        {eta}
                    </motion.p>
                </div>
            </div>

            { }
            <div style={{ display: 'flex', gap: 4, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
                {STAGES.map((s, i) => (
                    <motion.div key={i} title={s.label}
                        style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: i < stageIdx ? 'var(--j-green)' : i === stageIdx ? 'var(--j-core)' : 'rgba(0,212,255,0.1)',
                            boxShadow: i === stageIdx ? '0 0 12px var(--j-core), 0 0 4px var(--j-core)' : i < stageIdx ? '0 0 6px var(--j-green)' : 'none',
                        }}
                        animate={i === stageIdx ? { scale: [1, 1.7, 1] } : { scale: 1 }}
                        transition={{ duration: 0.8, repeat: i === stageIdx ? Infinity : 0 }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function UploadPage() {
    const [mode, setMode] = useState('git');
    const [gitUrl, setGitUrl] = useState('');
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [running, setRunning] = useState(false);
    const [progress, setProg] = useState(0);
    const [stageMsg, setStageMsg] = useState('');
    const [stageIdx, setStageIdx] = useState(0);
    const [err, setErr] = useState('');
    const [done, setDone] = useState(null);
    const fileRef = useRef(null);
    const navigate = useNavigate();
    const { elapsed, reset: resetTimer } = useStopwatch(running);

    const reset = useCallback(() => {
        setProg(0); setStageMsg(''); setStageIdx(0); setErr('');
        setDone(null); setFile(null); setGitUrl(''); resetTimer();
    }, [resetTimer]);

    const handleFile = (f) => {
        if (!f?.name?.endsWith('.zip')) { sounds.error(); setErr('Only ZIP archives are accepted.'); return; }
        sounds.notify(); setFile(f); setErr('');
    };

    const submit = async () => {
        if (mode === 'git' && !gitUrl.trim()) { sounds.error(); setErr('Enter a Git repository URL.'); return; }
        if (mode === 'zip' && !file) { sounds.error(); setErr('Select a ZIP file.'); return; }

        sounds.launch();
        setRunning(true); setErr(''); setProg(2); setStageMsg('Connecting to analysis engine…'); setStageIdx(0); setDone(null);
        resetTimer();

        const fd = new FormData();
        if (mode === 'git') fd.append('repo_url', gitUrl.trim());
        else fd.append('file', file);

        try {
            const token = localStorage.getItem('ar_token');
            const response = await fetch('http://127.0.0.1:8000/api/assess/run', {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
            });
            if (!response.ok) {
                const detail = await response.json().catch(() => ({}));
                throw new Error(detail?.detail || `Server error ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done: streamDone, value } = await reader.read();
                if (streamDone) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n'); buffer = lines.pop();
                for (const line of lines) {
                    if (!line.startsWith('data:')) continue;
                    try {
                        const evt = JSON.parse(line.slice(5).trim());
                        if (evt.type === 'progress') {
                            setProg(evt.progress ?? 0);
                            setStageMsg(evt.message || '');
                            const idx = STAGES.findIndex(s => s.key === evt.stage);
                            if (idx >= 0) setStageIdx(idx);
                            sounds.scan();
                        } else if (evt.type === 'complete') {
                            setProg(100); setStageIdx(STAGES.length - 1);
                            setStageMsg('Report generated!');
                            sounds.success();
                            setDone(evt.id); setRunning(false);
                        } else if (evt.type === 'error') {
                            throw new Error(evt.message);
                        }
                    } catch (_) { }
                }
            }
        } catch (e) {
            sounds.error(); setErr(e?.message || 'Analysis failed.'); setRunning(false);
        }
    };

    return (
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'stretch' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            { }
            <div className="glass-panel hud-corners" style={{ padding: '20px 28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', opacity: 0.14, pointerEvents: 'none' }}>
                    {[60, 90, 120].map((s, i) => <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2, borderRadius: '50%', border: '1px solid #00d4ff', animation: `arcSpin ${8 + i * 4}s linear infinite` }} />)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Cpu size={13} style={{ color: 'var(--j-core)' }} className="icon-glow" />
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.22em', color: 'var(--j-core)', textTransform: 'uppercase' }}>9-Layer Analysis Engine</span>
                </div>
                <h1 className="hud-title gradient-text" style={{ fontSize: '1.4rem', marginBottom: 4 }}>Submit Project</h1>
                <p style={{ color: 'var(--t3)', fontSize: '0.82rem' }}>56 rules · 9 analysis layers · exact file+line problem locations</p>
            </div>

            { }
            <AnimatePresence>
                {done && (
                    <motion.div className="glass-panel" style={{ padding: 32, textAlign: 'center', border: '1px solid rgba(0,255,157,0.25)' }}
                        initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,255,157,0.08)', border: '2px solid var(--j-green)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', animation: 'arcCore 2.5s infinite' }}>
                            <CheckCircle size={32} style={{ color: 'var(--j-green)' }} />
                        </div>
                        <p className="hud-title" style={{ color: 'var(--j-green)', fontSize: '1.05rem', marginBottom: 4 }}>Analysis Complete!</p>
                        <p style={{ color: 'var(--t3)', fontSize: '0.8rem', marginBottom: 4 }}>Completed in {fmtTime(elapsed)}</p>
                        <p style={{ color: 'var(--t2)', fontSize: '0.84rem', marginBottom: 24 }}>All 9 layers · 56 rules · detailed report ready.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <motion.button className="btn-jarvis btn-jarvis-primary" style={{ padding: '12px 28px' }}
                                onClick={() => { sounds.launch(); navigate(`/report/${done}`); }}
                                whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>View Report →</motion.button>
                            <motion.button style={{ padding: '12px 22px', borderRadius: 14, background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--t2)', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}
                                onClick={() => { sounds.click(); reset(); }}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                                <RefreshCw size={13} style={{ display: 'inline', marginRight: 7 }} />New Analysis
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            { }
            {!done && !running && (
                <motion.div className="glass-panel hud-corners" style={{ padding: 28 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    { }
                    <div style={{ display: 'flex', gap: 6, marginBottom: 24, padding: 5, borderRadius: 14, background: 'rgba(0,212,255,0.04)', border: '1px solid var(--border-dim)', width: 'fit-content' }}>
                        {[{ id: 'git', Icon: GitBranch, label: 'Git URL' }, { id: 'zip', Icon: CloudUpload, label: 'ZIP Upload' }].map(({ id, Icon, label }) => (
                            <motion.button key={id} onClick={() => { sounds.click(); setMode(id); setErr(''); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                                    background: mode === id ? 'var(--grad-repulsor)' : 'transparent',
                                    color: mode === id ? '#020714' : 'var(--t2)',
                                    boxShadow: mode === id ? '0 4px 14px rgba(0,212,255,0.35)' : 'none'
                                }}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
                                <Icon size={13} />{label}
                            </motion.button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {mode === 'git' ? (
                            <motion.div key="git" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }}>
                                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
                                    <GitBranch size={10} style={{ display: 'inline', marginRight: 5 }} />Repository URL
                                </label>
                                <input className="input-jarvis" value={gitUrl}
                                    onChange={e => { sounds.type(); setGitUrl(e.target.value); setErr(''); }}
                                    placeholder="https://github.com/owner/repository" />
                                <p style={{ margin: '6px 0 0 2px', fontSize: '0.7rem', color: 'var(--t4)' }}>Public GitHub / GitLab URL</p>
                            </motion.div>
                        ) : (
                            <motion.div key="zip" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                                <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                                    onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                                    onClick={() => fileRef.current?.click()}
                                    style={{ padding: 32, border: `2px dashed ${dragging ? 'var(--j-core)' : 'var(--border-dim)'}`, borderRadius: 16, textAlign: 'center', cursor: 'pointer', transition: 'all 200ms', background: dragging ? 'rgba(0,212,255,0.06)' : 'rgba(0,212,255,0.015)' }}>
                                    <input ref={fileRef} type="file" accept=".zip" hidden onChange={e => handleFile(e.target.files[0])} />
                                    <CloudUpload size={34} style={{ color: file ? 'var(--j-green)' : 'var(--j-core)', margin: '0 auto 10px', display: 'block' }} />
                                    <p style={{ fontWeight: 700, color: file ? 'var(--j-green)' : 'var(--t1)', fontSize: '0.88rem' }}>
                                        {file ? `✅ ${file.name}` : 'Drop ZIP here or click to browse'}
                                    </p>
                                    <p style={{ color: 'var(--t4)', fontSize: '0.72rem', marginTop: 5 }}>Maximum 50 MB · .zip files only</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {err && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.28)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                <AlertTriangle size={13} style={{ color: 'var(--j-red)', flexShrink: 0 }} />
                                <p style={{ color: 'var(--j-red)', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>{err}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button className="btn-jarvis btn-jarvis-primary"
                        style={{ marginTop: 22, width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '0.92rem', borderRadius: 14 }}
                        onClick={submit} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
                        <Cpu size={16} /> Run 9-Layer Analysis
                    </motion.button>
                </motion.div>
            )}

            { }
            <AnimatePresence>
                {running && (
                    <motion.div className="glass-panel hud-corners"
                        style={{ padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                        <ArcReactor progress={progress} stageMsg={stageMsg} stageIdx={stageIdx} elapsed={elapsed} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
