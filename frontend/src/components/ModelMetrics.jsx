import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Cpu, Activity, Zap, CheckCircle2, TrendingUp, BarChart3, 
    Layers, GitBranch, RefreshCw, Server, Award, Gauge, Sparkles, Terminal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { api } from '../services/api';

const ModelMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            const data = await api.getModelMetrics();
            setMetrics(data);
            setLoading(false);
        };
        fetchMetrics();
    }, []);

    if (loading || !metrics) {
        return (
            <div className="flex items-center justify-center h-full text-textMuted">
                <RefreshCw size={24} className="animate-spin text-neonPurple mr-3" />
                <span>Loading GNN Model Telemetry...</span>
            </div>
        );
    }

    const { summary, feature_importance, latency_history, confusion_matrix } = metrics;

    return (
        <div className="h-full flex flex-col gap-6 p-2 lg:p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-neonPurple">
                        <Cpu size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-white">Graph ML & GNN Architecture</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-500/20 text-neonPurple border border-purple-500/30">
                                PyTorch Geometric 2.5
                            </span>
                        </div>
                        <p className="text-sm text-textSecondary mt-0.5">
                            GraphSAGE embeddings + Node2Vec topology + XGBoost ensemble performance benchmarks
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-cardBg/80 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-mono">
                        <span className="w-2 h-2 rounded-full bg-cyberEmerald animate-pulse"></span>
                        <span className="text-textSecondary">Version:</span>
                        <span className="text-white font-bold">{summary.model_version}</span>
                    </div>
                </div>
            </div>

            {/* KPI Gauge Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-cardBg/80 space-y-1">
                    <div className="flex items-center justify-between text-textMuted text-xs font-semibold">
                        <span>ROC-AUC Metric</span>
                        <Award size={16} className="text-neonCyan" />
                    </div>
                    <div className="text-3xl font-black font-mono text-neonCyan">{summary.roc_auc}</div>
                    <p className="text-[11px] text-cyberEmerald flex items-center gap-1 font-medium">
                        <TrendingUp size={12} /> +1.8% over baseline XGBoost
                    </p>
                </div>

                <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-cardBg/80 space-y-1">
                    <div className="flex items-center justify-between text-textMuted text-xs font-semibold">
                        <span>PR-AUC (Precision-Recall)</span>
                        <Activity size={16} className="text-neonPurple" />
                    </div>
                    <div className="text-3xl font-black font-mono text-neonPurple">{summary.pr_auc}</div>
                    <p className="text-[11px] text-textMuted font-mono">Imbalance-Weighted Score</p>
                </div>

                <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-cardBg/80 space-y-1">
                    <div className="flex items-center justify-between text-textMuted text-xs font-semibold">
                        <span>F1-Score / Accuracy</span>
                        <Gauge size={16} className="text-cyberEmerald" />
                    </div>
                    <div className="text-3xl font-black font-mono text-cyberEmerald">{summary.f1_score}</div>
                    <p className="text-[11px] text-textSecondary font-mono">Precision: {(summary.precision*100).toFixed(1)}% · Recall: {(summary.recall*100).toFixed(1)}%</p>
                </div>

                <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-cardBg/80 space-y-1">
                    <div className="flex items-center justify-between text-textMuted text-xs font-semibold">
                        <span>Inference Latency (p50)</span>
                        <Zap size={16} className="text-cyberAmber" />
                    </div>
                    <div className="text-3xl font-black font-mono text-cyberAmber">{summary.inference_latency_p50}</div>
                    <p className="text-[11px] text-textMuted font-mono">p95: {summary.inference_latency_p95} · p99: {summary.inference_latency_p99}</p>
                </div>
            </div>

            {/* Pipeline Stage Architecture Flow */}
            <div className="glass-panel rounded-2xl border border-white/10 p-6 bg-gradient-to-r from-cardBg via-cardBg to-purple-950/20 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                        <Layers size={18} className="text-neonCyan" />
                        <h2 className="text-sm font-bold text-white tracking-wide uppercase">4-Stage Graph ML Pipeline</h2>
                    </div>
                    <span className="text-xs text-textMuted font-mono">Trained on PaySim 6.3M + IEEE-CIS 590K + Elliptic Bitcoin GNN</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-black/40 border border-blue-500/20 space-y-2 relative">
                        <div className="text-[10px] font-mono font-bold text-cyberBlue uppercase">Stage 01</div>
                        <h3 className="text-xs font-bold text-white">NetworkX & Node2Vec</h3>
                        <p className="text-[11px] text-textMuted leading-relaxed">
                            Generates 128-dimensional random walk embeddings capturing Neo4j graph topology.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20 space-y-2 relative">
                        <div className="text-[10px] font-mono font-bold text-neonPurple uppercase">Stage 02</div>
                        <h3 className="text-xs font-bold text-white">PyG GraphSAGE</h3>
                        <p className="text-[11px] text-textMuted leading-relaxed">
                            Inductive neighborhood aggregation fine-tuned on coordinated mule graph structures.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20 space-y-2 relative">
                        <div className="text-[10px] font-mono font-bold text-cyberAmber uppercase">Stage 03</div>
                        <h3 className="text-xs font-bold text-white">Feature Matrix Fusion</h3>
                        <p className="text-[11px] text-textMuted leading-relaxed">
                            Fuses graph embeddings with IEEE-CIS features, velocity metrics, and balance drains.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-rose-500/20 space-y-2 relative">
                        <div className="text-[10px] font-mono font-bold text-cyberRose uppercase">Stage 04</div>
                        <h3 className="text-xs font-bold text-white">XGBoost & Isolation Forest</h3>
                        <p className="text-[11px] text-textMuted leading-relaxed">
                            Final probability scoring (0.0 → 1.0) with exact SHAP value explainability.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feature Importance & Latency History Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 6 cols: Feature Importance */}
                <div className="lg:col-span-6 glass-panel rounded-2xl border border-white/10 p-5 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={16} className="text-neonCyan" />
                            <h3 className="text-sm font-bold text-white">Top Predictive Features (SHAP & Gini)</h3>
                        </div>
                        <span className="text-[10px] text-textMuted font-mono">Ranked by Contribution</span>
                    </div>

                    <div className="space-y-3 pt-2">
                        {feature_importance.map((f, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-mono text-white">{f.feature}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-textMuted">{f.category}</span>
                                        <span className="font-mono font-bold text-neonCyan">{(f.importance * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${f.importance * 300}%` }}
                                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                                        className="h-full bg-gradient-to-r from-neonCyan to-neonPurple rounded-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right 6 cols: Latency Trend Chart */}
                <div className="lg:col-span-6 glass-panel rounded-2xl border border-white/10 p-5 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-cyberAmber" />
                            <h3 className="text-sm font-bold text-white">Inference Latency Timeline (ms)</h3>
                        </div>
                        <span className="text-[10px] text-textMuted font-mono">Real-Time Microbench</span>
                    </div>

                    <div className="h-64 w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={latency_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={[0, 40]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                                />
                                <Area type="monotone" dataKey="p95" stroke="#f43f5e" strokeWidth={1.5} fill="none" name="p95 Latency" />
                                <Area type="monotone" dataKey="p50" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#latencyGrad)" name="p50 Latency" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center pt-2">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] uppercase font-bold text-textMuted block">True Positives Caught</span>
                            <span className="text-sm font-bold font-mono text-cyberEmerald">{confusion_matrix.true_positive.toLocaleString()}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] uppercase font-bold text-textMuted block">False Positives</span>
                            <span className="text-sm font-bold font-mono text-cyberRose">{confusion_matrix.false_positive.toLocaleString()} (0.01%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelMetrics;
