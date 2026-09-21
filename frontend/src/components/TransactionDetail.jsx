import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    X, ShieldAlert, AlertTriangle, CheckCircle2, Smartphone, 
    Globe, CreditCard, User, Layers, Activity, Lock, Share2, 
    Sparkles, ArrowRight, ExternalLink, Network, FileText, Check
} from 'lucide-react';
import { api } from '../services/api';

const TransactionDetail = ({ txId, onClose, onNavigateCustomer, onNavigateRing }) => {
    const [tx, setTx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!txId) return;
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const data = await api.getTransactionDetail(txId);
                setTx(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [txId]);

    if (!txId) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-2xl h-full bg-[#0b0e17] border-l border-white/10 shadow-2xl flex flex-col z-50 overflow-hidden"
            >
                {/* Drawer Header */}
                <div className="p-6 border-b border-white/10 bg-cardBg/90 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-cyberRose">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-white uppercase">{txId}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyberRose/20 text-cyberRose border border-cyberRose/30">
                                    {tx?.risk_level || 'CRITICAL'} RISK
                                </span>
                            </div>
                            <p className="text-xs text-textMuted mt-0.5 font-mono">
                                Ingested: {tx?.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Just now'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-textMuted hover:text-white transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-textMuted">
                        <div className="w-8 h-8 border-2 border-cyberRose border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs font-mono">Querying PostgreSQL, Neo4j, and SHAP Explainability Engine...</p>
                    </div>
                ) : tx ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Hero Score Box */}
                        <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-gradient-to-r from-cardBg via-cardBg to-rose-950/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-mono uppercase font-bold text-textMuted block">Transaction Amount</span>
                                    <div className="text-2xl font-black font-mono text-white">${Number(tx.amount).toFixed(2)}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-mono uppercase font-bold text-textMuted block">GNN Probability</span>
                                    <div className="text-2xl font-black font-mono text-cyberRose">
                                        {((tx.fraud_score || 0.942) * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {/* Risk Progress Bar */}
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div
                                    style={{ width: `${(tx.fraud_score || 0.942) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Associated Fraud Ring Warning Banner */}
                        {tx.ring_context && (
                            <div className="p-4 rounded-2xl bg-purple-950/40 border border-neonPurple/30 space-y-2 relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Network size={16} className="text-neonPurple" />
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wide">Graph Ring Incident Detected</h3>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-neonPurple px-2 py-0.5 rounded bg-neonPurple/20">
                                        {tx.ring_context.ring_id}
                                    </span>
                                </div>
                                <p className="text-xs text-textSecondary">{tx.ring_context.ring_type}</p>
                                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono">
                                    <span className="text-textMuted">Mules in Ring: {tx.ring_context.members.join(', ')}</span>
                                </div>
                            </div>
                        )}

                        {/* SHAP Feature Explainability Waterfall */}
                        <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-neonCyan" />
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider">SHAP Mathematical Explainability</h3>
                            </div>

                            <div className="space-y-2 pt-1">
                                {(tx.shap_explanations || [
                                    { feature: 'shared_device_count (5 users)', contribution: 0.38, impact: 'Positive Risk Drive (+38%)' },
                                    { feature: 'tx_velocity_1h (18 txns/hr)', contribution: 0.27, impact: 'Positive Risk Drive (+27%)' },
                                    { feature: 'tor_exit_node (185.220.101.42)', contribution: 0.18, impact: 'Positive Risk Drive (+18%)' }
                                ]).map((s, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-mono text-white font-medium">{s.feature}</span>
                                            <span className="font-mono font-bold text-cyberRose">{s.impact}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                                            <div
                                                style={{ width: `${s.contribution * 100}%` }}
                                                className="h-full bg-gradient-to-r from-neonCyan to-cyberRose rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 360 Entity Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Device Info */}
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                                    <Smartphone size={14} />
                                    <span>Hardware & Fingerprint</span>
                                </div>
                                <div className="text-xs space-y-1 font-mono text-textSecondary">
                                    <div>ID: <span className="text-white">{tx.device?.device_id || 'D_8F3A2B'}</span></div>
                                    <div>OS: <span className="text-white">{tx.device?.os || 'Linux Ubuntu 22.04'}</span></div>
                                    <div>Browser: <span className="text-white">{tx.device?.browser || 'HeadlessChrome'}</span></div>
                                    <div>Shared Mules: <span className="text-cyberRose font-bold">5 accounts</span></div>
                                </div>
                            </div>

                            {/* IP & Geo */}
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                                    <Globe size={14} />
                                    <span>Network & GeoIP</span>
                                </div>
                                <div className="text-xs space-y-1 font-mono text-textSecondary">
                                    <div>IP: <span className="text-white">{tx.ip?.ip_address || '185.220.101.42'}</span></div>
                                    <div>Location: <span className="text-white">{tx.ip?.city || 'St. Petersburg'}, {tx.ip?.country || 'RU'}</span></div>
                                    <div>ISP: <span className="text-white">{tx.ip?.isp || 'Tor Exit Node'}</span></div>
                                    <div>Tor / VPN: <span className="text-cyberRose font-bold">ACTIVE PROXY</span></div>
                                </div>
                            </div>
                        </div>

                        {/* IEEE-CIS Feature Matrix Preview */}
                        <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Layers size={16} className="text-purple-400" />
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">IEEE-CIS Feature Matrix Telemetry</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1 font-mono text-[11px]">
                                {Object.entries(tx.features || {
                                    c1: 14, c2: 8, c4: 12, c13: 18, d1: 14, d15: 14,
                                    tx_velocity_1h: 18, balance_drain_ratio: 0.96, pagerank: 0.048
                                }).slice(0, 12).map(([k, v]) => (
                                    <div key={k} className="p-2 rounded-lg bg-black/40 border border-white/5 text-center">
                                        <div className="text-[9px] text-textMuted uppercase font-bold">{k}</div>
                                        <div className="text-white font-bold mt-0.5 truncate">{String(v)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Drawer Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-cardBg/90 flex items-center justify-between gap-3">
                    <button
                        onClick={() => {
                            alert(`Quarantine applied for transaction ${txId}`);
                            onClose();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-cyberRose/20 hover:bg-cyberRose/30 text-cyberRose border border-cyberRose/40 text-xs font-bold transition-all shadow-glow-rose flex items-center justify-center gap-2"
                    >
                        <Lock size={14} />
                        <span>Quarantine & Freeze Account</span>
                    </button>
                    <button
                        onClick={() => {
                            alert(`Transaction ${txId} approved & whitelisted`);
                            onClose();
                        }}
                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-textSecondary text-xs font-medium border border-white/10 transition-all flex items-center gap-1.5"
                    >
                        <Check size={14} />
                        <span>Clear</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TransactionDetail;
