import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, ShieldAlert, AlertTriangle, CheckCircle2, Play, Pause, 
    Search, Filter, Smartphone, Globe, CreditCard, ArrowUpRight, 
    RefreshCw, Layers, ShieldCheck, Zap, Lock
} from 'lucide-react';
import { api } from '../services/api';

const LiveFeed = ({ onSelectTransaction }) => {
    const [transactions, setTransactions] = useState([]);
    const [isStreaming, setIsStreaming] = useState(true);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState('all');
    const [selectedTopic, setSelectedTopic] = useState('transactions_raw');

    const fetchStream = async () => {
        try {
            const data = await api.getTransactions(30);
            setTransactions(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStream();
        const interval = setInterval(() => {
            if (isStreaming) {
                fetchStream();
            }
        }, 3000 / speedMultiplier);

        return () => clearInterval(interval);
    }, [isStreaming, speedMultiplier]);

    const filteredTransactions = transactions.filter(t => {
        if (riskFilter === 'high' && !(t.is_fraud || (t.fraud_score && t.fraud_score > 0.7))) return false;
        if (riskFilter === 'normal' && (t.is_fraud || (t.fraud_score && t.fraud_score > 0.3))) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                (t.tx_id && t.tx_id.toLowerCase().includes(q)) ||
                (t.customer_id && t.customer_id.toLowerCase().includes(q)) ||
                (t.merchant_id && t.merchant_id.toLowerCase().includes(q)) ||
                (t.ip_address && t.ip_address.toLowerCase().includes(q))
            );
        }
        return true;
    });

    const getRiskIndicator = (tx) => {
        const score = tx.fraud_score !== undefined ? tx.fraud_score : (tx.is_fraud ? 0.92 : 0.08);
        if (score > 0.7 || tx.is_fraud) {
            return (
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyberRose/20 text-cyberRose border border-cyberRose/30">
                        <ShieldAlert size={12} className="animate-pulse" /> Critical ({(score * 100).toFixed(0)}%)
                    </span>
                </div>
            );
        }
        if (score > 0.3) {
            return (
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyberAmber/20 text-cyberAmber border border-cyberAmber/30">
                        <AlertTriangle size={12} /> Elevated ({(score * 100).toFixed(0)}%)
                    </span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyberEmerald/20 text-cyberEmerald border border-cyberEmerald/30">
                    <CheckCircle2 size={12} /> Normal ({(score * 100).toFixed(0)}%)
                </span>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col gap-6 p-2 lg:p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-neonCyan">
                        <Activity size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-white">Live Ingestion Feed</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-cyan-500/20 text-neonCyan border border-cyan-500/30">
                                Kafka Streaming
                            </span>
                        </div>
                        <p className="text-sm text-textSecondary mt-0.5">
                            Real-time transaction ingestion, GNN scoring pipeline, and Kafka consumer telemetry
                        </p>
                    </div>
                </div>

                {/* Stream Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-cardBg/80 border border-white/10 p-1 rounded-xl">
                        <button
                            onClick={() => setIsStreaming(!isStreaming)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isStreaming
                                    ? 'bg-cyberEmerald/20 text-cyberEmerald border border-cyberEmerald/40'
                                    : 'bg-cardBg text-textMuted hover:text-white'
                            }`}
                        >
                            {isStreaming ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-cyberEmerald animate-pulse" />
                                    <span>Live Stream</span>
                                </>
                            ) : (
                                <>
                                    <Pause size={12} />
                                    <span>Paused</span>
                                </>
                            )}
                        </button>
                        <div className="flex items-center px-2 gap-1 text-[11px] font-mono text-textMuted border-l border-white/10">
                            {[1, 2, 5].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSpeedMultiplier(s)}
                                    className={`px-1.5 py-0.5 rounded ${speedMultiplier === s ? 'bg-white/10 text-white font-bold' : 'hover:text-white'}`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="glass-panel rounded-2xl border border-white/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-cardBg/80">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {['all', 'high', 'normal'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRiskFilter(r)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                riskFilter === r
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                    : 'bg-white/5 text-textMuted hover:text-white'
                            }`}
                        >
                            {r === 'all' ? 'All Transactions' : `${r} Risk Only`}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                        type="text"
                        placeholder="Search Tx ID, Customer ID, IP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-textMuted focus:outline-none focus:border-neonCyan"
                    />
                </div>
            </div>

            {/* Live Table */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden bg-cardBg/90 shadow-2xl flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase font-bold text-textMuted tracking-wider bg-black/40 border-b border-white/10 sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3.5">Timestamp</th>
                                <th className="px-5 py-3.5">Transaction ID</th>
                                <th className="px-5 py-3.5">Customer & Entity</th>
                                <th className="px-5 py-3.5">Amount</th>
                                <th className="px-5 py-3.5">Type / Merchant</th>
                                <th className="px-5 py-3.5">Risk Score</th>
                                <th className="px-5 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                            <AnimatePresence>
                                {filteredTransactions.map((tx) => (
                                    <motion.tr
                                        key={tx.tx_id}
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => onSelectTransaction(tx.tx_id)}
                                        className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                    >
                                        <td className="px-5 py-3.5 text-textSecondary text-[11px]">
                                            {new Date(tx.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-white group-hover:text-neonCyan transition-colors">
                                            {tx.tx_id}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-cyan-300 font-bold">{tx.customer_id}</div>
                                            <div className="text-[10px] text-textMuted flex items-center gap-1 font-sans">
                                                <span>{tx.country || 'US'}</span>
                                                {tx.vpn_flag && <span className="text-cyberRose font-bold font-mono">VPN</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 font-black text-white text-sm">
                                            ${Number(tx.amount).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-textPrimary font-bold text-[11px]">{tx.tx_type || 'TRANSFER'}</div>
                                            <div className="text-[10px] text-textMuted truncate max-w-[140px]">{tx.merchant_id || 'Direct Peer'}</div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {getRiskIndicator(tx)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button className="px-3 py-1 rounded-lg bg-white/5 hover:bg-neonCyan/20 hover:text-neonCyan text-textMuted text-[11px] font-bold transition-all flex items-center gap-1 ml-auto">
                                                <span>Inspect</span>
                                                <ArrowUpRight size={12} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                <div className="p-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-textMuted font-mono">
                    <span>Showing {filteredTransactions.length} of {transactions.length} buffered stream frames</span>
                    <span className="flex items-center gap-1.5 text-cyberEmerald">
                        <span className="w-2 h-2 rounded-full bg-cyberEmerald animate-pulse"></span>
                        Topic: `transactions_raw` active
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LiveFeed;
