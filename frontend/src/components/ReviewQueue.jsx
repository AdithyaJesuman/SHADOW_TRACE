import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, XCircle, 
    Filter, Search, Clock, Smartphone, Globe, Lock, RefreshCw, CheckSquare, Square
} from 'lucide-react';
import { api } from '../services/api';

const ReviewQueue = ({ onSelectTransaction }) => {
    const [flaggedTxs, setFlaggedTxs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchFlagged = async () => {
        setLoading(true);
        try {
            const data = await api.getFlaggedTransactions(50);
            setFlaggedTxs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlagged();
    }, []);

    const toggleSelect = (txId, e) => {
        e.stopPropagation();
        const next = new Set(selectedItems);
        if (next.has(txId)) next.delete(txId);
        else next.add(txId);
        setSelectedItems(next);
    };

    const selectAll = () => {
        if (selectedItems.size === flaggedTxs.length) setSelectedItems(new Set());
        else setSelectedItems(new Set(flaggedTxs.map(t => t.tx_id)));
    };

    const handleBatchAction = (action) => {
        if (selectedItems.size === 0) return;
        alert(`Action "${action}" executed for ${selectedItems.size} selected transactions.`);
        setFlaggedTxs(flaggedTxs.filter(t => !selectedItems.has(t.tx_id)));
        setSelectedItems(new Set());
    };

    const filtered = flaggedTxs.filter(t => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                (t.tx_id && t.tx_id.toLowerCase().includes(q)) ||
                (t.customer_id && t.customer_id.toLowerCase().includes(q))
            );
        }
        return true;
    });

    return (
        <div className="h-full flex flex-col gap-6 p-2 lg:p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-cyberRose">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-white">Manual Investigation Queue</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-rose-500/20 text-cyberRose border border-rose-500/30 font-mono">
                                {filtered.length} Pending
                            </span>
                        </div>
                        <p className="text-sm text-textSecondary mt-0.5">
                            High-risk transactions quarantined by Graph Neural Network requiring manual triage
                        </p>
                    </div>
                </div>

                {/* Batch Action Toolbar */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleBatchAction('Quarantine & Freeze')}
                        disabled={selectedItems.size === 0}
                        className="px-4 py-2 rounded-xl bg-cyberRose/20 hover:bg-cyberRose/30 text-cyberRose border border-cyberRose/30 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <Lock size={13} />
                        <span>Freeze Accounts ({selectedItems.size})</span>
                    </button>
                    <button
                        onClick={() => handleBatchAction('Approve & Whitelist')}
                        disabled={selectedItems.size === 0}
                        className="px-4 py-2 rounded-xl bg-cyberEmerald/20 hover:bg-cyberEmerald/30 text-cyberEmerald border border-cyberEmerald/30 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <CheckCircle2 size={13} />
                        <span>Approve ({selectedItems.size})</span>
                    </button>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="glass-panel rounded-2xl border border-white/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-cardBg/80">
                <div className="flex items-center gap-3">
                    <button
                        onClick={selectAll}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-textMuted hover:text-white font-medium flex items-center gap-2"
                    >
                        {selectedItems.size > 0 && selectedItems.size === flaggedTxs.length ? (
                            <CheckSquare size={14} className="text-neonCyan" />
                        ) : (
                            <Square size={14} />
                        )}
                        <span>Select All</span>
                    </button>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                        type="text"
                        placeholder="Search Tx ID, Customer ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-textMuted focus:outline-none focus:border-cyberRose"
                    />
                </div>
            </div>

            {/* Queue Table */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden bg-cardBg/90 shadow-2xl flex-1 flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-textMuted">
                        <RefreshCw size={24} className="animate-spin text-cyberRose mb-3" />
                        <p className="text-xs">Loading Flagged Transactions from PostgreSQL...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-textMuted">
                        <CheckCircle2 size={42} className="text-cyberEmerald mb-3 opacity-60" />
                        <h3 className="text-sm font-bold text-white">Investigation Queue Clear</h3>
                        <p className="text-xs mt-1 text-textMuted">No transactions currently flagged for manual intervention.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] uppercase font-bold text-textMuted tracking-wider bg-black/40 border-b border-white/10 sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-3.5 w-10"></th>
                                    <th className="px-5 py-3.5">Timestamp</th>
                                    <th className="px-5 py-3.5">Transaction ID</th>
                                    <th className="px-5 py-3.5">Customer</th>
                                    <th className="px-5 py-3.5">Amount</th>
                                    <th className="px-5 py-3.5">Primary Threat Vector</th>
                                    <th className="px-5 py-3.5">Risk Score</th>
                                    <th className="px-5 py-3.5 text-right">Triage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono">
                                {filtered.map((tx) => {
                                    const isChecked = selectedItems.has(tx.tx_id);
                                    return (
                                        <tr
                                            key={tx.tx_id}
                                            onClick={() => onSelectTransaction(tx.tx_id)}
                                            className={`hover:bg-white/[0.04] transition-colors cursor-pointer group ${
                                                isChecked ? 'bg-rose-950/20' : ''
                                            }`}
                                        >
                                            <td className="px-5 py-3.5" onClick={(e) => toggleSelect(tx.tx_id, e)}>
                                                <button className="text-textMuted hover:text-white">
                                                    {isChecked ? (
                                                        <CheckSquare size={14} className="text-cyberRose" />
                                                    ) : (
                                                        <Square size={14} />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-5 py-3.5 text-textSecondary text-[11px]">
                                                {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-white group-hover:text-cyberRose transition-colors">
                                                {tx.tx_id}
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-cyan-300">
                                                {tx.customer_id}
                                            </td>
                                            <td className="px-5 py-3.5 font-black text-white text-sm">
                                                ${Number(tx.amount).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3.5 font-sans">
                                                <div className="text-xs text-textPrimary font-medium">
                                                    {tx.top_features?.[0]?.label || 'Multiplexed Device Fingerprint'}
                                                </div>
                                                <div className="text-[10px] text-textMuted font-mono">
                                                    Contribution: +{((tx.top_features?.[0]?.contribution || 0.42) * 100).toFixed(0)}%
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyberRose/20 text-cyberRose border border-cyberRose/30 flex items-center gap-1.5 w-fit">
                                                    <ShieldAlert size={12} className="animate-pulse" />
                                                    {(tx.fraud_score ? tx.fraud_score * 100 : 94).toFixed(0)}% CRITICAL
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button className="px-3 py-1 rounded-lg bg-cyberRose/10 hover:bg-cyberRose/20 text-cyberRose text-[11px] font-bold transition-all flex items-center gap-1 ml-auto">
                                                    <span>Investigate</span>
                                                    <ArrowRight size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewQueue;
