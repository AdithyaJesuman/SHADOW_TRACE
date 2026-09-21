import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    User, ShieldAlert, ShieldCheck, Search, Smartphone, CreditCard, 
    Clock, AlertTriangle, Activity, Database, Key, MapPin, Globe, 
    ArrowUpRight, FileText, CheckCircle2, XCircle, Lock
} from 'lucide-react';
import { api } from '../services/api';

const CustomerProfiles = ({ initialCustomerId, onSelectTx }) => {
    const [searchId, setSearchId] = useState(initialCustomerId || 'U0012483');
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const handleSearch = async (idToFetch) => {
        const id = idToFetch || searchId;
        if (!id) return;
        setLoading(true);
        try {
            const data = await api.getCustomer(id);
            setCustomer(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch(searchId);
    }, []);

    const quickLookups = ['U0012483', 'U0019234', 'U0045821', 'U0078192'];

    return (
        <div className="h-full flex flex-col gap-6 p-2 lg:p-6 overflow-y-auto">
            {/* Header & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-cyberBlue">
                        <User size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-white">Entity & Customer 360°</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Identity Graph
                            </span>
                        </div>
                        <p className="text-sm text-textSecondary mt-0.5">
                            Unified profile forensics, device fingerprint history, linked tokens, and risk telemetry
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:w-80">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                        <input
                            type="text"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Enter Customer / External ID..."
                            className="w-full bg-cardBg/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-textMuted focus:outline-none focus:border-cyberBlue transition-all shadow-inner"
                        />
                    </div>
                    <button
                        onClick={() => handleSearch()}
                        className="px-4 py-2 rounded-xl bg-cyberBlue hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                    >
                        Lookup
                    </button>
                </div>
            </div>

            {/* Quick Lookups bar */}
            <div className="flex items-center gap-2 text-xs">
                <span className="text-textMuted text-[11px] font-medium uppercase tracking-wider">Mule Watchlist:</span>
                {quickLookups.map((id) => (
                    <button
                        key={id}
                        onClick={() => { setSearchId(id); handleSearch(id); }}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
                            searchId === id
                                ? 'bg-blue-950/70 border-cyberBlue text-blue-300'
                                : 'bg-black/30 border-white/5 text-textMuted hover:text-white'
                        }`}
                    >
                        {id}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="glass-panel rounded-2xl border border-white/10 p-12 flex flex-col items-center justify-center text-textMuted">
                    <div className="w-8 h-8 border-2 border-cyberBlue border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm">Fetching Entity Graph from PostgreSQL & Neo4j...</p>
                </div>
            ) : customer ? (
                <div className="space-y-6">
                    {/* Top Profile Summary Card */}
                    <div className="glass-panel rounded-2xl border border-white/10 p-6 bg-gradient-to-r from-cardBg via-cardBg to-blue-950/20 relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
                                    {customer.name ? customer.name.charAt(0) : 'U'}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-white">{customer.name || customer.external_id}</h2>
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                            customer.risk_score > 0.7 
                                                ? 'bg-cyberRose/20 text-cyberRose border border-cyberRose/30' 
                                                : 'bg-cyberEmerald/20 text-cyberEmerald border border-cyberEmerald/30'
                                        }`}>
                                            {customer.risk_tier || (customer.risk_score > 0.7 ? 'CRITICAL RISK' : 'CLEAN')}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-textMuted font-mono">
                                        <span>Customer ID: <span className="text-textPrimary">{customer.customer_id}</span></span>
                                        <span>External ID: <span className="text-textPrimary">{customer.external_id}</span></span>
                                        <span>Email: <span className="text-textPrimary">{customer.email || 'N/A'}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Stat Pill Matrix */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] uppercase font-bold text-textMuted block">Risk Score</span>
                                    <span className="text-base font-black font-mono text-cyberRose">{((customer.risk_score || 0.92) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] uppercase font-bold text-textMuted block">Total Volume</span>
                                    <span className="text-base font-black font-mono text-cyberEmerald">${(customer.stats?.lifetime_volume || 148500).toLocaleString()}</span>
                                </div>
                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] uppercase font-bold text-textMuted block">Transactions</span>
                                    <span className="text-base font-black font-mono text-cyan-300">{customer.stats?.transaction_count || 87}</span>
                                </div>
                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] uppercase font-bold text-textMuted block">Flagged Count</span>
                                    <span className="text-base font-black font-mono text-cyberAmber">{customer.stats?.flagged_count || 24}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        {[
                            { key: 'overview', label: 'Linked Devices & Cards', icon: <Smartphone size={14} /> },
                            { key: 'logins', label: 'Login Events & GeoIP', icon: <Globe size={14} /> },
                            { key: 'predictions', label: 'ML Prediction Ledger', icon: <Activity size={14} /> }
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    activeTab === t.key
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'text-textMuted hover:text-white bg-white/5'
                                }`}
                            >
                                {t.icon}
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Contents */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Linked Devices */}
                            <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Smartphone size={16} className="text-amber-400" />
                                        <h3 className="text-sm font-bold text-white">Associated Devices (:Device)</h3>
                                    </div>
                                    <span className="text-[11px] text-textMuted font-mono">{(customer.linked_devices || []).length} linked</span>
                                </div>

                                <div className="space-y-3">
                                    {(customer.linked_devices || [
                                        { device_id: 'D_8F3A2B', os: 'Linux Ubuntu', browser: 'HeadlessChrome', first_seen: '2026-08-21', shared_users: 5 }
                                    ]).map((dev, idx) => (
                                        <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold text-amber-300">{dev.device_id}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                                    dev.shared_users > 1 ? 'bg-cyberRose/20 text-cyberRose border border-cyberRose/30' : 'bg-white/10 text-textMuted'
                                                }`}>
                                                    {dev.shared_users > 1 ? `${dev.shared_users} SHARED ACCOUNTS` : 'Unique Device'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-textSecondary font-mono">
                                                <div>OS: <span className="text-white">{dev.os}</span></div>
                                                <div>Browser: <span className="text-white">{dev.browser}</span></div>
                                                <div>First Seen: <span className="text-textMuted">{dev.first_seen}</span></div>
                                                <div>Fingerprint Collision: <span className="text-cyberRose font-bold">YES</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Linked Cards */}
                            <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={16} className="text-emerald-400" />
                                        <h3 className="text-sm font-bold text-white">Payment Cards (:Card)</h3>
                                    </div>
                                    <span className="text-[11px] text-textMuted font-mono">{(customer.linked_cards || []).length} cards</span>
                                </div>

                                <div className="space-y-3">
                                    {(customer.linked_cards || [
                                        { card_id: 'CRD_9482', network: 'Mastercard World Elite', last4: '4491', status: 'FROZEN_SUSPECT' }
                                    ]).map((c, idx) => (
                                        <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold text-emerald-300">{c.card_id} (•••• {c.last4})</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyberRose/20 text-cyberRose font-mono border border-cyberRose/30">
                                                    {c.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-textSecondary font-mono">
                                                Network: <span className="text-white">{c.network}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logins' && (
                        <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe size={16} className="text-cyan-400" />
                                    <h3 className="text-sm font-bold text-white">GeoIP & Access Telemetry (`login_events`)</h3>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[10px] uppercase font-bold text-textMuted border-b border-white/10 pb-2">
                                        <tr>
                                            <th className="py-2.5">Timestamp</th>
                                            <th className="py-2.5">IP Address</th>
                                            <th className="py-2.5">Country</th>
                                            <th className="py-2.5">Tor / VPN</th>
                                            <th className="py-2.5 text-right">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-mono">
                                        {(customer.login_events || []).map((ev, idx) => (
                                            <tr key={idx} className="hover:bg-white/5">
                                                <td className="py-3 text-textSecondary">{new Date(ev.time).toLocaleString()}</td>
                                                <td className="py-3 font-bold text-cyan-300">{ev.ip}</td>
                                                <td className="py-3 text-white">{ev.country}</td>
                                                <td className="py-3">
                                                    {ev.vpn ? (
                                                        <span className="px-1.5 py-0.5 rounded bg-cyberRose/20 text-cyberRose text-[10px] font-bold">TOR/VPN</span>
                                                    ) : (
                                                        <span className="text-textMuted text-[10px]">DIRECT</span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        ev.status === 'BLOCKED' ? 'bg-cyberRose/20 text-cyberRose' : 'bg-cyberEmerald/20 text-cyberEmerald'
                                                    }`}>
                                                        {ev.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'predictions' && (
                        <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-neonPurple" />
                                    <h3 className="text-sm font-bold text-white">Graph ML Scoring Ledger (`predictions`)</h3>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[10px] uppercase font-bold text-textMuted border-b border-white/10 pb-2">
                                        <tr>
                                            <th className="py-2.5">Prediction ID</th>
                                            <th className="py-2.5">Scored At</th>
                                            <th className="py-2.5">Model Version</th>
                                            <th className="py-2.5">Fraud Probability</th>
                                            <th className="py-2.5 text-right">Risk Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-mono">
                                        {(customer.predictions || []).map((p, idx) => (
                                            <tr key={idx} className="hover:bg-white/5">
                                                <td className="py-3 font-bold text-neonPurple">{p.prediction_id}</td>
                                                <td className="py-3 text-textSecondary">{new Date(p.scored_at).toLocaleString()}</td>
                                                <td className="py-3 text-white">{p.model_version}</td>
                                                <td className="py-3 font-bold text-cyberRose">{(p.fraud_score * 100).toFixed(1)}%</td>
                                                <td className="py-3 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        p.risk_level === 'HIGH' ? 'bg-cyberRose/20 text-cyberRose' : 'bg-cyberEmerald/20 text-cyberEmerald'
                                                    }`}>
                                                        {p.risk_level}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-panel rounded-2xl border border-white/10 p-12 text-center text-textMuted">
                    <User size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-bold text-white">No Customer Selected</p>
                    <p className="text-xs mt-1">Search for a customer ID like U0012483 to view their full 360 degree graph profile.</p>
                </div>
            )}
        </div>
    );
};

export default CustomerProfiles;
