import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Zap, Send, ShieldAlert, CheckCircle2, AlertTriangle, 
    Terminal, RefreshCw, Smartphone, Globe, CreditCard, Sparkles, Code
} from 'lucide-react';
import { api } from '../services/api';

const attackPresets = [
    {
        id: 'device_ring',
        name: 'Shared Device Mule Ring Attack',
        icon: <Smartphone size={16} className="text-cyberRose" />,
        desc: 'Multiplexing 5 different customer accounts on single headless Linux device ID',
        payload: {
            customer_id: 'C1045892',
            merchant_id: 'M_BinanceP2P_801',
            amount: 9850.00,
            tx_type: 'TRANSFER',
            device_id: 'D_8F3A2B',
            ip_id: 'IP_99214',
            card_id: 'CRD_9482',
            timestamp: new Date().toISOString()
        }
    },
    {
        id: 'velocity_burst',
        name: 'High-Velocity Card Cashout Burst',
        icon: <Zap size={16} className="text-cyberAmber" />,
        desc: '15 rapid-fire transactions under 60 seconds testing stolen card credentials',
        payload: {
            customer_id: 'C1033109',
            merchant_id: 'M_SteamGames_992',
            amount: 499.99,
            tx_type: 'PAYMENT',
            device_id: 'D_IPHONE_CL',
            ip_id: 'IP_VPN_NORD',
            card_id: 'CRD_4481',
            timestamp: new Date().toISOString()
        }
    },
    {
        id: 'night_drain',
        name: 'Off-Hours Account Exfiltration',
        icon: <Globe size={16} className="text-neonPurple" />,
        desc: '95% balance exfiltration at 3:15 AM via offshore VPN IP address',
        payload: {
            customer_id: 'C1088190',
            merchant_id: 'M_DarkWebRelay_09',
            amount: 14200.00,
            tx_type: 'CASH_OUT',
            device_id: 'D_OFFSHORE',
            ip_id: 'IP_TOR_EXIT',
            card_id: 'CRD_8812',
            timestamp: new Date().toISOString()
        }
    },
    {
        id: 'clean_tx',
        name: 'Normal Verified Customer Purchase',
        icon: <CheckCircle2 size={16} className="text-cyberEmerald" />,
        desc: 'Low-risk daytime payment from trusted hardware fingerprint',
        payload: {
            customer_id: 'C1000412',
            merchant_id: 'M_AppleStore_104',
            amount: 89.50,
            tx_type: 'PAYMENT',
            device_id: 'D_TRUSTED_MAC',
            ip_id: 'IP_HOME_RES',
            card_id: 'CRD_PRIME',
            timestamp: new Date().toISOString()
        }
    }
];

const Simulator = ({ onTransactionInjected }) => {
    const [selectedPreset, setSelectedPreset] = useState(attackPresets[0]);
    const [jsonText, setJsonText] = useState(JSON.stringify(attackPresets[0].payload, null, 2));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseLog, setResponseLog] = useState(null);

    const handleSelectPreset = (preset) => {
        setSelectedPreset(preset);
        setJsonText(JSON.stringify(preset.payload, null, 2));
    };

    const handleSend = async () => {
        setIsSubmitting(true);
        setResponseLog(null);
        try {
            const parsed = JSON.parse(jsonText);
            parsed.timestamp = new Date().toISOString();
            const result = await api.sendTransaction(parsed);
            setResponseLog(result);
            if (onTransactionInjected) onTransactionInjected(parsed);
        } catch (err) {
            setResponseLog({ error: 'JSON Parse Error or Connection Refused', detail: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 p-2 lg:p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-cyberAmber">
                        <Zap size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-white">Fraud Attack & Ingestion Studio</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/20 text-cyberAmber border border-amber-500/30">
                                Kafka Pipeline Ingest
                            </span>
                        </div>
                        <p className="text-sm text-textSecondary mt-0.5">
                            Simulate coordinated fraud ring payloads and test real-time scoring via POST /transactions
                        </p>
                    </div>
                </div>
            </div>

            {/* Attack Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {attackPresets.map((p) => {
                    const isSelected = selectedPreset.id === p.id;
                    return (
                        <button
                            key={p.id}
                            onClick={() => handleSelectPreset(p)}
                            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                                isSelected
                                    ? 'bg-cardBg/90 border-cyberAmber shadow-lg shadow-amber-500/10 ring-1 ring-cyberAmber'
                                    : 'bg-cardBg/40 border-white/5 hover:border-white/15 hover:bg-cardBg/70'
                            }`}
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        {p.icon}
                                    </div>
                                    {isSelected && (
                                        <span className="text-[10px] font-mono font-bold text-cyberAmber uppercase px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">
                                            ACTIVE
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xs font-bold text-white">{p.name}</h3>
                                <p className="text-[11px] text-textMuted leading-relaxed">{p.desc}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Code Editor & Live Response Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[400px]">
                {/* Left 7 cols: JSON Payload Editor */}
                <div className="lg:col-span-7 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden bg-[#06080e]">
                    <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
                        <div className="flex items-center gap-2">
                            <Code size={16} className="text-neonCyan" />
                            <span className="text-xs font-mono font-bold text-white uppercase">Payload: POST /transactions</span>
                        </div>
                        <span className="text-[10px] text-textMuted font-mono">Topic: transactions_raw</span>
                    </div>

                    <div className="flex-1 p-4">
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            spellCheck={false}
                            className="w-full h-full min-h-[260px] bg-transparent font-mono text-xs text-neonCyan focus:outline-none resize-none leading-relaxed selection:bg-cyan-500/30"
                        />
                    </div>

                    <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between">
                        <span className="text-xs text-textMuted">Dispatches via Producer with Redis idempotency</span>
                        <button
                            onClick={handleSend}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyberAmber to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                            <span>Inject Transaction Event</span>
                        </button>
                    </div>
                </div>

                {/* Right 5 cols: Live Response Feedback */}
                <div className="lg:col-span-5 glass-panel rounded-2xl border border-white/10 p-5 flex flex-col justify-between bg-cardBg/80 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <Terminal size={16} className="text-neonPurple" />
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider">FastAPI & GNN Scoring Response</h3>
                            </div>
                        </div>

                        {responseLog ? (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-textMuted font-mono">Ingest Status:</span>
                                        <span className="text-xs font-mono font-bold text-cyberEmerald">{responseLog.status || 'OK'}</span>
                                    </div>

                                    {responseLog.simulated_score !== undefined && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-textMuted font-mono">Fraud Probability:</span>
                                            <span className={`text-base font-black font-mono ${
                                                responseLog.simulated_score > 0.7 ? 'text-cyberRose' : 'text-cyberEmerald'
                                            }`}>
                                                {(responseLog.simulated_score * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}

                                    {responseLog.risk_level && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-textMuted font-mono">Risk Level:</span>
                                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded uppercase ${
                                                responseLog.risk_level === 'HIGH' ? 'bg-cyberRose/20 text-cyberRose' : 'bg-cyberEmerald/20 text-cyberEmerald'
                                            }`}>
                                                {responseLog.risk_level}
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-[11px] text-textSecondary font-mono border-t border-white/5 pt-2">
                                        {responseLog.message || JSON.stringify(responseLog)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-textMuted border border-dashed border-white/10 rounded-xl space-y-2">
                                <Sparkles size={28} className="mx-auto text-cyberAmber opacity-40" />
                                <p className="text-xs font-medium text-white">Ready for Ingestion</p>
                                <p className="text-[11px] text-textMuted">Click "Inject Transaction Event" to dispatch payload to Kafka topic and watch scoring.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-textMuted font-mono">
                        Pipeline: Kafka `transactions_raw` ➔ db.py ➔ Neo4j & Postgres ➔ GraphSAGE Ingest
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Simulator;
