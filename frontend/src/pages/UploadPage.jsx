import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { CloudUpload, GitBranch, CheckCircle, AlertTriangle, Cpu, RefreshCw } from 'lucide-react';
import sounds from '../utils/sound';

/* ---------------- CONSTANTS ---------------- */

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

/* ---------------- MAIN COMPONENT ---------------- */

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

    // 🔥 NEW STATES
    const [aiReport, setAiReport] = useState("");
    const [staticReport, setStaticReport] = useState(null);

    const fileRef = useRef(null);
    const navigate = useNavigate();

    const reset = useCallback(() => {
        setProg(0);
        setStageMsg('');
        setStageIdx(0);
        setErr('');
        setDone(null);
        setFile(null);
        setGitUrl('');
    }, []);

    const handleFile = (f) => {
        if (!f?.name?.endsWith('.zip')) {
            sounds.error();
            setErr('Only ZIP files allowed');
            return;
        }
        setFile(f);
        setErr('');
    };

    const submit = async () => {
        if (mode === 'git' && !gitUrl.trim()) {
            setErr('Enter Git URL');
            return;
        }
        if (mode === 'zip' && !file) {
            setErr('Upload ZIP file');
            return;
        }

        setRunning(true);
        setProg(5);
        setErr('');

        const fd = new FormData();
        if (mode === 'git') fd.append('repo_url', gitUrl.trim());
        else fd.append('file', file);

        try {
            const token = localStorage.getItem('ar_token');

            const response = await fetch('http://127.0.0.1:8000/api/assess/run', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';

            while (true) {
                const { done: streamDone, value } = await reader.read();
                if (streamDone) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.startsWith('data:')) continue;

                    const evt = JSON.parse(line.replace('data:', '').trim());

                    if (evt.type === 'progress') {
                        setProg(evt.progress || 0);
                        setStageMsg(evt.message || '');

                        const idx = STAGES.findIndex(s => s.key === evt.stage);
                        if (idx >= 0) setStageIdx(idx);

                    } else if (evt.type === 'complete') {

                        // 🔥 SAVE REPORTS
                        setAiReport(evt.ai_report);
                        setStaticReport(evt.static_report);

                        setDone(evt.id);
                        setRunning(false);
                        setProg(100);

                    } else if (evt.type === 'error') {
                        throw new Error(evt.message);
                    }
                }
            }

        } catch (e) {
            setErr(e.message);
            setRunning(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>

            <h2>Upload Project</h2>

            {mode === 'git' ? (
                <input
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    placeholder="GitHub URL"
                />
            ) : (
                <input
                    type="file"
                    ref={fileRef}
                    onChange={(e) => handleFile(e.target.files[0])}
                />
            )}

            <div style={{ marginTop: 10 }}>
                <button onClick={() => setMode('git')}>Git</button>
                <button onClick={() => setMode('zip')}>ZIP</button>
            </div>

            <button onClick={submit} style={{ marginTop: 20 }}>
                Run Analysis
            </button>

            {running && <p>Progress: {progress}%</p>}
            {err && <p style={{ color: 'red' }}>{err}</p>}

            {/* ✅ SUCCESS */}
            {done && (
                <div style={{ marginTop: 20 }}>
                    <h3>Analysis Complete ✅</h3>

                    <button
                        onClick={() =>
                            navigate(`/report/${done}`, {
                                state: {
                                    aiReport,
                                    staticReport
                                }
                            })
                        }
                    >
                        View Report
                    </button>
                </div>
            )}
        </div>
    );
}