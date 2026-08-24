import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import TransactionDetail from './TransactionDetail';

const ReviewQueue = () => {
    const [flaggedTxs, setFlaggedTxs] = useState([]);
    const [selectedTx, setSelectedTx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFlagged = async () => {
            setLoading(true);
            try {
                const data = await api.getFlaggedTransactions(100);
                setFlaggedTxs(data);
            } catch (err) {
                setError("Could not load review queue.");
            } finally {
                setLoading(false);
            }
        };
        fetchFlagged();
    }, []);

    const getFraudBadge = (isFraud) => {
        return isFraud ? (
            <span className="flex items-center gap-1.5 w-fit text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert size={14} /> High Risk
            </span>
        ) : (
            <span className="flex items-center gap-1.5 w-fit text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                <AlertTriangle size={14} /> Suspicious
            </span>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Review Queue</h2>
                <p className="text-slate-400 mt-1">Manual investigation queue for flagged transactions</p>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center gap-3 shadow-sm">
                    <ShieldAlert size={18} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden relative">
                
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 font-medium">Loading queue...</p>
                    </div>
                )}

                {!loading && flaggedTxs.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
                        <ShieldAlert size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-slate-300">Queue is clear</p>
                        <p className="text-sm mt-1">No flagged transactions require manual review.</p>
                    </div>
                )}

                {!loading && flaggedTxs.length > 0 && (
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-950/50 border-b border-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Risk Level</th>
                                    <th className="px-6 py-4 font-semibold"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {flaggedTxs.map((tx) => (
                                    <tr
                                        key={tx.tx_id}
                                        onClick={() => setSelectedTx(tx.tx_id)}
                                        className="hover:bg-slate-800/40 transition-all cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-indigo-300 text-xs">
                                            {tx.tx_id.substring(0, 12)}...
                                        </td>
                                        <td className="px-6 py-4 text-slate-200 font-semibold">
                                            ${parseFloat(tx.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {tx.tx_type}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getFraudBadge(tx.is_fraud)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                                <span className="text-xs font-bold uppercase tracking-wider mr-2 opacity-0 group-hover:opacity-100 transition-opacity">Investigate</span>
                                                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Slide-over Panel for Transaction Details */}
            <AnimatePresence>
                {selectedTx && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTx(null)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
                        />
                        <motion.div 
                            initial={{ x: '100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.5 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-100 tracking-tight">Investigation Profile</h2>
                                    <p className="text-xs text-indigo-400 font-mono mt-1">{selectedTx}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedTx(null)} 
                                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <TransactionDetail txId={selectedTx} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReviewQueue;
