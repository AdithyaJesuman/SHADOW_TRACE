import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

const LiveFeed = () => {
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.getTransactions(25);
                setTransactions(data);
                setError(null);
            } catch (err) {
                setError("Connection to Shadow Trace Core lost. Retrying...");
            }
        };

        fetchData();
        const intervalId = setInterval(() => {
            if (isPolling) fetchData();
        }, 3000);

        return () => clearInterval(intervalId);
    }, [isPolling]);

    const getFraudIndicator = (score) => {
        if (score > 0.7) {
            return (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md w-fit">
                    <ShieldAlert size={14} className="animate-pulse" />
                    <span className="text-xs font-bold tracking-wide uppercase">Critical</span>
                </div>
            );
        }
        if (score > 0.3) {
            return (
                <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md w-fit">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-bold tracking-wide uppercase">Elevated</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit">
                <CheckCircle2 size={14} />
                <span className="text-xs font-bold tracking-wide uppercase">Normal</span>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Live Stream</h2>
                    <p className="text-slate-400 mt-1">Real-time transaction ingestion and model scoring</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-1.5 shadow-sm">
                    <button 
                        onClick={() => setIsPolling(!isPolling)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            isPolling ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Live
                    </button>
                    <button 
                        onClick={() => setIsPolling(!isPolling)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            !isPolling ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Paused
                    </button>
                </div>
            </div>
            
            {error && (
                <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center gap-3 shadow-sm">
                    <ShieldAlert size={18} />
                    <span className="font-medium">{error}</span>
                </div>
            )}
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-950/50 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Time</th>
                            <th className="px-6 py-4 font-semibold">Customer ID</th>
                            <th className="px-6 py-4 font-semibold">Amount</th>
                            <th className="px-6 py-4 font-semibold">Type</th>
                            <th className="px-6 py-4 font-semibold">Risk Level</th>
                            <th className="px-6 py-4 font-semibold text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        <AnimatePresence initial={false}>
                            {transactions.length === 0 && !error && (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Awaiting data stream...</td></tr>
                            )}
                            
                            {transactions.map((tx) => (
                                <motion.tr 
                                    key={tx.tx_id} 
                                    initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                                    animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="hover:bg-slate-800/30 transition-colors group"
                                >
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                        {new Date(tx.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-indigo-300">
                                        {tx.customer_id.substring(0, 8)}<span className="text-slate-600">...</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-200 font-medium">
                                        ${tx.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {tx.tx_type}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getFraudIndicator(tx.is_fraud ? 0.9 : 0.1)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {tx.is_flagged ? (
                                            <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-[0_0_8px_rgba(244,63,94,0.2)]">
                                                Flagged
                                            </span>
                                        ) : (
                                            <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border border-slate-700">
                                                Cleared
                                            </span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LiveFeed;
