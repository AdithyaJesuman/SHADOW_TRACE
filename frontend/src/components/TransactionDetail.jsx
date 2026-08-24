import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

const Section = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500/50"></span>
            {title}
        </h3>
        <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-1">
            {children}
        </div>
    </div>
);

const KV = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center text-sm py-2.5 px-3 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/30 transition-colors rounded-lg">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className={`text-right max-w-[250px] truncate ${highlight ? 'text-rose-400 font-bold' : 'text-slate-200 font-medium'}`} title={value}>
            {value !== null && value !== undefined ? String(value) : <span className="text-slate-600 italic">N/A</span>}
        </span>
    </div>
);

const FeatureGrid = ({ features }) => {
    if (!features) return <p className="text-sm text-slate-500 italic p-4">No feature data recorded.</p>;

    const groups = {
        "Card Profile (C)": Object.entries(features).filter(([k]) => k.startsWith('c')),
        "Time Delta (D)": Object.entries(features).filter(([k]) => k.startsWith('d')),
        "Match Data (M)": Object.entries(features).filter(([k]) => k.startsWith('m')),
    };

    return (
        <div className="space-y-4 p-3">
            {Object.entries(groups).map(([groupName, entries]) => (
                <div key={groupName}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{groupName}</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {entries.map(([key, val]) => (
                            <div key={key} className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-center flex flex-col justify-center">
                                <span className="text-slate-500 text-[9px] uppercase font-bold mb-0.5">{key}</span>
                                <span className="font-mono text-slate-300 text-xs truncate" title={val}>{val !== null ? String(val) : '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const TransactionDetail = ({ txId }) => {
    const [tx, setTx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!txId) return;

        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            const data = await api.getTransactionDetail(txId);
            if (data) {
                setTx(data);
            } else {
                setError("Could not load transaction details.");
            }
            setLoading(false);
        };

        fetchDetail();
    }, [txId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
                <p>Retrieving full telemetry...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-rose-400">
                <AlertTriangle size={32} className="mb-4" />
                <p>{error}</p>
            </div>
        );
    }

    if (!tx) return null;

    return (
        <div className="p-6">
            
            {/* Risk Banner */}
            <div className={`mb-8 p-4 rounded-xl border flex items-start gap-4 ${tx.is_fraud ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <div className={`p-2 rounded-lg ${tx.is_fraud ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {tx.is_fraud ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                </div>
                <div>
                    <h4 className={`text-lg font-bold ${tx.is_fraud ? 'text-rose-400' : 'text-emerald-400'} tracking-tight`}>
                        {tx.is_fraud ? 'High Risk Transaction Detected' : 'Transaction Cleared'}
                    </h4>
                    <p className="text-slate-400 text-sm mt-1">
                        {tx.is_flagged ? "Flagged by rules engine for manual review." : "Passed automated screening."}
                    </p>
                </div>
            </div>

            <Section title="Transaction Ledger">
                <KV label="Amount" value={`$${parseFloat(tx.amount).toFixed(2)}`} highlight={tx.amount > 1000} />
                <KV label="Type" value={tx.tx_type} />
                <KV label="Product Code" value={tx.product_code} />
                <KV label="Timestamp" value={new Date(tx.timestamp).toLocaleString()} />
                <KV label="Balance Before" value={tx.balance_before ? `$${tx.balance_before}` : null} />
                <KV label="Balance After" value={tx.balance_after ? `$${tx.balance_after}` : null} />
                <KV label="Idempotency Key" value={tx.idempotency_key} />
            </Section>

            {tx.customer && (
                <Section title="Customer Profile">
                    <KV label="External ID" value={tx.customer.external_id} />
                    <KV label="Risk Score" value={tx.customer.risk_score} highlight={tx.customer.risk_score > 0.5} />
                    <KV label="Historical Fraud" value={tx.customer.is_fraud ? "⚠️ YES" : "No"} highlight={tx.customer.is_fraud} />
                </Section>
            )}

            {tx.merchant && (
                <Section title="Merchant Data">
                    <KV label="External ID" value={tx.merchant.external_id} />
                    <KV label="Category" value={tx.merchant.category} />
                    <KV label="Country" value={tx.merchant.country} />
                </Section>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8">
                {tx.device && (
                    <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Device</h3>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="text-slate-200">{tx.device.device_type || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">OS</span><span className="text-slate-200">{tx.device.os || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Browser</span><span className="text-slate-200">{tx.device.browser || '—'}</span></div>
                        </div>
                    </div>
                )}

                {tx.ip && (
                    <div className="bg-slate-800/20 border border-slate-800/60 rounded-xl p-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Network</h3>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-slate-400">IP</span><span className="text-slate-200 font-mono text-xs">{tx.ip.ip_address}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Location</span><span className="text-slate-200">{tx.ip.city}, {tx.ip.country}</span></div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">VPN / Tor</span>
                                <span className={tx.ip.vpn_flag || tx.ip.tor_flag ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                                    {tx.ip.vpn_flag || tx.ip.tor_flag ? 'Detected' : 'Clean'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Section title="Model Telemetry (Features)">
                <FeatureGrid features={tx.features} />
            </Section>

            {tx.identity ? (
                <Section title="Identity Graph Record">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3">
                        {Object.entries(tx.identity)
                            .filter(([k]) => k.startsWith('id_'))
                            .map(([key, val]) => (
                                <div key={key} className="bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1 text-center">
                                    <span className="text-slate-500 text-[8px] uppercase font-bold block">{key}</span>
                                    <span className="font-mono text-slate-300 text-[10px] truncate block" title={val}>{val !== null ? String(val) : '—'}</span>
                                </div>
                            ))}
                    </div>
                </Section>
            ) : (
                <Section title="Identity Graph Record">
                    <p className="text-sm text-slate-500 italic p-4">No identity graph mapping exists for this transaction.</p>
                </Section>
            )}

        </div>
    );
};

export default TransactionDetail;
