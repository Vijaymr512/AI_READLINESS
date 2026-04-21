import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
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

/* ---------------- NEW: GET NAVIGATION STATE ---------------- */
const useReportState = () => {
    const location = useLocation();
    return {
        aiReportFromNav: location.state?.aiReport,
        staticReportFromNav: location.state?.staticReport
    };
};

/* ---------------- CONSTANTS ---------------- */

const STATUS_COLORS = {
    Strong: '#22d3ee', Moderate: '#fbbf24', Weak: '#f97316', Critical: '#f43f5e'
};

/* ---------------- MAIN COMPONENT ---------------- */

export default function ReportPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    const { aiReportFromNav } = useReportState();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [dlOpen, setDlOpen] = useState(false);

    useEffect(() => {
        api.get(`/report/${id}`)
            .then(r => setReport(r.data))
            .catch(() => setErr('Report not found or access denied.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading...</div>;
    if (err) return <div>{err}</div>;

    /* 🔥 FINAL AI REPORT SOURCE */
    const aiReport = location.state?.aiReport || report?.ai_report;

    const {
        score,
        status,
        executive_summary,
        layer_scores = {}
    } = report;

    const layerEntries = Object.entries(layer_scores);

    /* 🔥 UPDATED TABS */
    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'layers', label: '9-Layer Analysis' },
        { id: 'diagnostics', label: 'Diagnostics' },
        { id: 'risks', label: 'Risk Register' },
        { id: 'profile', label: 'Project Profile' },
        { id: 'ai', label: '🧠 AI Report' }   // ✅ NEW
    ];

    return (
        <div style={{ padding: 20 }}>

            {/* BACK BUTTON */}
            <button onClick={() => navigate('/dashboard')}>
                ← Back
            </button>

            <h2>AI Readiness Report</h2>

            {/* TABS */}
            <div style={{ marginBottom: 20 }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        style={{
                            marginRight: 10,
                            background: activeTab === t.id ? '#6d28d9' : '#ccc',
                            color: activeTab === t.id ? '#fff' : '#000'
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ---------------- OVERVIEW ---------------- */}
            {activeTab === 'overview' && (
                <div>
                    <h3>Score: {score}</h3>
                    <p>Status: {status}</p>
                    <p>{executive_summary}</p>
                </div>
            )}

            {/* ---------------- LAYERS ---------------- */}
            {activeTab === 'layers' && (
                <div>
                    {layerEntries.map(([k, v]) => (
                        <div key={k}>
                            <b>{k}</b>: {v}
                        </div>
                    ))}
                </div>
            )}

            {/* ---------------- AI REPORT ---------------- */}
            {activeTab === 'ai' && (
  <div className="glass-panel" style={{
    padding: 28,
    borderRadius: 16,
    background: 'linear-gradient(145deg, rgba(20,10,40,0.9), rgba(10,5,25,0.95))',
    border: '1px solid rgba(168,85,247,0.2)',
    boxShadow: '0 0 30px rgba(168,85,247,0.15)'
  }}>
    
    {/* HEADER */}
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontSize: '1.1rem',
        fontWeight: 900,
        color: '#a855f7',
        letterSpacing: '0.05em'
      }}>
        🧠 AI Analysis Report
      </h2>
      <p style={{
        fontSize: '0.8rem',
        color: 'var(--t3)'
      }}>
        Generated using LLM reasoning based on multi-layer analysis
      </p>
    </div>

    {!aiReport ? (
      <p style={{ color: 'var(--t3)' }}>No AI report available</p>
    ) : (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        lineHeight: 1.8,
        fontSize: '0.9rem'
      }}>
        
        <ReactMarkdown
          remarkPlugins={[require('remark-gfm')]}
          components={{
            
            h1: ({node, ...props}) => (
              <h1 style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#22d3ee',
                marginTop: 20
              }} {...props} />
            ),

            h2: ({node, ...props}) => (
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: '#a855f7',
                marginTop: 16,
                borderBottom: '1px solid rgba(168,85,247,0.2)',
                paddingBottom: 6
              }} {...props} />
            ),

            p: ({node, ...props}) => (
              <p style={{
                color: 'var(--t2)',
                lineHeight: 1.8
              }} {...props} />
            ),

            li: ({node, ...props}) => (
              <li style={{
                marginBottom: 6,
                color: 'var(--t2)'
              }} {...props} />
            ),

            strong: ({node, ...props}) => (
              <strong style={{ color: '#22d3ee' }} {...props} />
            ),

            code: ({node, ...props}) => (
              <code style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '2px 6px',
                borderRadius: 6,
                fontSize: '0.8rem'
              }} {...props} />
            )
          }}
        >
          {aiReport}
        </ReactMarkdown>

      </div>
    )}
  </div>
)}

        </div>
    );
}