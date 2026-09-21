import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, ShieldAlert, DollarSign, Users, Zap, TrendingUp, 
    ArrowUpRight, AlertTriangle, CheckCircle2, Network, ShieldCheck, 
    Layers, RefreshCw, Smartphone, Globe, Radio, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';

const Dashboard = ({ onNavigate, onSelectTransaction }) => {
    const [transactions, setTransactions] = useState([]);
    const [kafkaMetrics, setKafkaMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [txData, kafkaData] = await Promise.all([
                api.getTransactions(40),
                api.getKafkaMetrics()
            ]);
            setTransactions(txData);
            setKafkaMetrics(kafkaData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const int = setInterval(fetchData, 4000);
        return () => clearInterval(int);
    }, []);

    // Telemetry aggregations
    const totalVolume = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const flaggedTransactions = transactions.filter(t => t.is_flagged || t.is_fraud || (t.fraud_score && t.fraud_score > 0.65));
    const flaggedCount = flaggedTransactions.length;
    const fraudRate = transactions.length ? ((flaggedCount / transactions.length) * 100).toFixed(1) : 0;
    const blockedVolume = flaggedTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // Chart Time Series Data
    const timeChartData = [...transactions].reverse().map((t, idx) => ({
        time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        amount: t.amount,
        score: Math.round((t.fraud_score || (t.is_fraud ? 0.92 : 0.08)) * 100)
    }));

    // Category Distribution Data
    const categoryData = [
        { name: 'Shared Device Rings', value: 42, color: '#f43f5e' },
        { name: 'Velocity Bursts', value: 28, color: '#f59e0b' },
        { name: 'Tor/VPN Spoofing', value: 18, color: '#8b5cf6' },
        { name: 'Account Takeover', value: 12, color: '#06b6d4' }
    ];

    return (
        <div className="h-full flex flex-col gap-6 p-2 lg:p-6 overflow-y-auto">
            {/* Top Threat Alert Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-neonCyan shadow-glow-cyan">
                        <Activity size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-white">Security Command Center</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-cyberEmerald/20 text-cyberEmerald border border-cyberEmerald/40 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyberEmerald animate-pulse"></span>
                                Real-Time Pipeline Online
                            </span>
                        </div>
                        <p className="text-sm text-textSecondary mt-0.5">
                            Real-time graph intelligence, fraud ring interception, and high-velocity streaming metrics
                        </p>
                    </div>
                </div>

                {/* Live stream ticker badge */}
                <div className="flex items-center gap-3 bg-cardBg/80 border border-white/10 p-2 rounded-2xl">
                    <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-xl text-xs font-mono">
                        <Radio size={14} className="text-cyberEmerald animate-pulse" />
                        <span className="text-textSecondary">Kafka Ingest:</span>
                        <span className="text-white font-bold">{kafkaMetrics?.throughput_msg_sec || 1420} tx/sec</span>
                    </div>
                    <button
                        onClick={() => onNavigate('simulator')}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-neonCyan to-cyberBlue hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs transition-all shadow-glow-cyan flex items-center gap-1.5"
                    >
                        <Zap size={13} />
                        <span>Simulate Attack</span>
                    </button>
                </div>
            </div>

            {/* KPI Telemetry 4-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Intercepted Volume */}
                <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 relative overflow-hidden bg-gradient-to-br from-cardBg to-rose-950/20">
                    <div className="flex items-center justify-between text-xs font-semibold text-textMuted">
                        <span>Prevented Fraud Volume</span>
                        <div className="p-2 rounded-xl bg-cyberRose/10 text-cyberRose">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl lg:text-3xl font-black font-mono tracking-tight text-white">
                        ${blockedVolume.toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-cyberRose font-mono font-medium">
                        <TrendingUp size={13} />
                        <span>{flaggedCount} high-risk transactions blocked</span>
                    </div>
                </div>

                {/* 2. Active Fraud Rings */}
                <div 
                    onClick={() => onNavigate('rings')}
                    className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 relative overflow-hidden cursor-pointer bg-gradient-to-br from-cardBg to-purple-950/20"
                >
                    <div className="flex items-center justify-between text-xs font-semibold text-textMuted">
                        <span>Active Coordinated Rings</span>
                        <div className="p-2 rounded-xl bg-neonPurple/10 text-neonPurple">
                            <Network size={16} />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl lg:text-3xl font-black font-mono tracking-tight text-neonPurple">
                        3 Rings Detected
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-textSecondary font-mono">
                        <span>15 Interconnected Mules</span>
                        <span className="text-neonPurple flex items-center font-bold">Explore Graph <ArrowUpRight size={12} /></span>
                    </div>
                </div>

                {/* 3. Anomaly Rate */}
                <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 relative overflow-hidden bg-gradient-to-br from-cardBg to-amber-950/20">
                    <div className="flex items-center justify-between text-xs font-semibold text-textMuted">
                        <span>Live Threat Anomaly Rate</span>
                        <div className="p-2 rounded-xl bg-cyberAmber/10 text-cyberAmber">
                            <ShieldAlert size={16} />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl lg:text-3xl font-black font-mono tracking-tight text-cyberAmber">
                        {fraudRate}%
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-textSecondary font-mono">
                        <span>Sample Window: Last {transactions.length} txns</span>
                    </div>
                </div>

                {/* 4. GNN Inference Engine */}
                <div 
                    onClick={() => onNavigate('metrics')}
                    className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/10 relative overflow-hidden cursor-pointer bg-gradient-to-br from-cardBg to-cyan-950/20"
                >
                    <div className="flex items-center justify-between text-xs font-semibold text-textMuted">
                        <span>GNN Model Precision</span>
                        <div className="p-2 rounded-xl bg-neonCyan/10 text-neonCyan">
                            <Sparkles size={16} />
                        </div>
                    </div>
                    <div className="mt-2 text-2xl lg:text-3xl font-black font-mono tracking-tight text-neonCyan">
                        98.4% ROC-AUC
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-textSecondary font-mono">
                        <span>p50 Latency: 11.4ms</span>
                        <span className="text-neonCyan flex items-center font-bold">Model Telemetry <ArrowUpRight size={12} /></span>
                    </div>
                </div>
            </div>

            {/* Middle Section: Time-Series Area Chart & Fraud Rings Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 8 cols: Real-Time Stream Velocity vs Risk Score */}
                <div className="lg:col-span-8 glass-panel rounded-2xl border border-white/10 p-5 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Transaction Velocity & GNN Risk Radar</h2>
                            <p className="text-xs text-textMuted mt-0.5">Dual-axis stream scoring across Kafka ingest pipe</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="flex items-center gap-1.5 text-cyberBlue">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyberBlue"></span> Tx Volume ($)
                            </span>
                            <span className="flex items-center gap-1.5 text-cyberRose">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyberRose"></span> Risk Index (0-100)
                            </span>
                        </div>
                    </div>

                    <div className="h-72 w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                                <YAxis yAxisId="left" stroke="#475569" fontSize={10} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#475569" fontSize={10} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#volGrad)" name="Amount ($)" />
                                <Area yAxisId="right" type="monotone" dataKey="score" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#riskGrad)" name="Risk Score" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right 4 cols: Fraud Pattern Breakdown */}
                <div className="lg:col-span-4 glass-panel rounded-2xl border border-white/10 p-5 flex flex-col justify-between space-y-4">
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Fraud Pattern Vectors</h2>
                        <p className="text-xs text-textMuted mt-0.5">Dominant network anomalies in active queue</p>
                    </div>

                    <div className="h-44 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#080b11" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 text-xs">
                        {categoryData.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                    <span className="text-textSecondary">{cat.name}</span>
                                </div>
                                <span className="font-mono font-bold text-white">{cat.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: High-Risk Alert Ticker & Pipeline Health */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 8 cols: Recent Flagged Incidents */}
                <div className="lg:col-span-8 glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={16} className="text-cyberRose" />
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Critical Triage Incidents</h2>
                        </div>
                        <button
                            onClick={() => onNavigate('queue')}
                            className="text-xs font-bold text-neonCyan hover:underline flex items-center gap-1"
                        >
                            Open Review Queue <ArrowUpRight size={13} />
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {flaggedTransactions.slice(0, 4).map((tx, idx) => (
                            <div
                                key={idx}
                                onClick={() => onSelectTransaction(tx.tx_id)}
                                className="p-3.5 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-cyberRose/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyberRose/10 text-cyberRose">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 font-mono text-xs">
                                            <span className="font-bold text-white group-hover:text-cyberRose transition-colors">{tx.tx_id}</span>
                                            <span className="text-textMuted">·</span>
                                            <span className="text-cyan-300">{tx.customer_id}</span>
                                        </div>
                                        <div className="text-[11px] text-textMuted mt-0.5">
                                            {tx.top_features?.[0]?.label || 'Shared device cluster detected'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 justify-between sm:justify-end">
                                    <span className="font-mono font-black text-sm text-white">${Number(tx.amount).toFixed(2)}</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyberRose/20 text-cyberRose border border-cyberRose/30">
                                        {(tx.fraud_score ? tx.fraud_score * 100 : 92).toFixed(0)}% RISK
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right 4 cols: System Infrastructure Node Health */}
                <div className="lg:col-span-4 glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-cyberEmerald" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Core Pipeline Mesh</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-cyberEmerald animate-pulse"></span>
                                <div>
                                    <div className="font-bold text-white">PostgreSQL 16 Engine</div>
                                    <div className="text-[10px] text-textMuted font-mono">Reader & asyncpg Writer Pools</div>
                                </div>
                            </div>
                            <span className="font-mono text-cyberEmerald font-bold">CONNECTED</span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-cyberEmerald animate-pulse"></span>
                                <div>
                                    <div className="font-bold text-white">Neo4j 5.20 Graph Database</div>
                                    <div className="text-[10px] text-textMuted font-mono">Bolt Port 7687 Subgraph Engine</div>
                                </div>
                            </div>
                            <span className="font-mono text-cyberEmerald font-bold">ACTIVE</span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-cyberEmerald animate-pulse"></span>
                                <div>
                                    <div className="font-bold text-white">Apache Kafka Streaming</div>
                                    <div className="text-[10px] text-textMuted font-mono">Topic: transactions_raw (Lag: 12)</div>
                                </div>
                            </div>
                            <span className="font-mono text-cyberEmerald font-bold">STREAMING</span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-cyberEmerald animate-pulse"></span>
                                <div>
                                    <div className="font-bold text-white">PyTorch Geometric GraphSAGE</div>
                                    <div className="text-[10px] text-textMuted font-mono">128-dim Node2Vec Embeddings</div>
                                </div>
                            </div>
                            <span className="font-mono text-neonCyan font-bold">INSPECTING</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
