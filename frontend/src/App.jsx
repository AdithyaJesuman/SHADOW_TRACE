import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Network, Activity, ShieldAlert, User, 
    Cpu, Zap, Radio, Bell, Search, Shield, ChevronRight, Sparkles
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import RingExplorer from './components/RingExplorer';
import LiveFeed from './components/LiveFeed';
import ReviewQueue from './components/ReviewQueue';
import CustomerProfiles from './components/CustomerProfiles';
import ModelMetrics from './components/ModelMetrics';
import Simulator from './components/Simulator';
import TransactionDetail from './components/TransactionDetail';
import { api } from './services/api';

const navigationItems = [
    { id: 'overview', label: 'Command Center', icon: <LayoutDashboard size={17} />, badge: null },
    { id: 'rings', label: 'Graph Rings', icon: <Network size={17} />, badge: '3 Active' },
    { id: 'feed', label: 'Live Stream', icon: <Activity size={17} />, badge: '1.4k/s' },
    { id: 'queue', label: 'Review Queue', icon: <ShieldAlert size={17} />, badge: 'Critical' },
    { id: 'customers', label: 'Entity 360°', icon: <User size={17} />, badge: null },
    { id: 'metrics', label: 'GNN Architecture', icon: <Cpu size={17} />, badge: '98.4%' },
    { id: 'simulator', label: 'Attack Studio', icon: <Zap size={17} />, badge: 'Simulator' },
];

function App() {
    const [activeView, setActiveView] = useState('overview');
    const [selectedTxId, setSelectedTxId] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [healthStatus, setHealthStatus] = useState('online');

    useEffect(() => {
        const checkHealth = async () => {
            const h = await api.getHealth();
            setHealthStatus(h.status === 'ok' ? 'online' : 'simulator');
        };
        checkHealth();
    }, []);

    const handleSelectTx = (txId) => {
        setSelectedTxId(txId);
    };

    const handleNavigateCustomer = (customerId) => {
        setSelectedCustomerId(customerId);
        setSelectedTxId(null);
        setActiveView('customers');
    };

    const handleNavigateRing = () => {
        setSelectedTxId(null);
        setActiveView('rings');
    };

    const renderView = () => {
        switch (activeView) {
            case 'overview':
                return <Dashboard onNavigate={setActiveView} onSelectTransaction={handleSelectTx} />;
            case 'rings':
                return <RingExplorer onSelectTransaction={handleSelectTx} />;
            case 'feed':
                return <LiveFeed onSelectTransaction={handleSelectTx} />;
            case 'queue':
                return <ReviewQueue onSelectTransaction={handleSelectTx} />;
            case 'customers':
                return <CustomerProfiles initialCustomerId={selectedCustomerId} onSelectTx={handleSelectTx} />;
            case 'metrics':
                return <ModelMetrics />;
            case 'simulator':
                return <Simulator onTransactionInjected={(tx) => setActiveView('feed')} />;
            default:
                return <Dashboard onNavigate={setActiveView} onSelectTransaction={handleSelectTx} />;
        }
    };

    return (
        <div className="flex h-screen bg-darkBg font-sans text-textPrimary selection:bg-neonCyan/30 overflow-hidden bg-radial-vignette">
            {/* Left Sleek Cyber Sidebar */}
            <aside className="w-64 bg-sidebarBg flex flex-col flex-shrink-0 border-r border-cardBorder relative z-20 select-none">
                {/* Brand Header */}
                <div className="p-5 border-b border-cardBorder">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-glow-cyan text-black">
                            <Shield size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-base font-black tracking-wider text-white font-mono">SHADOW</span>
                                <span className="text-base font-black tracking-wider text-neonCyan font-mono">TRACE</span>
                            </div>
                            <div className="text-[10px] text-textMuted uppercase tracking-widest font-semibold">
                                Fraud Ring Intelligence
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
                    <div className="text-[10px] font-bold text-textSubtle uppercase tracking-widest px-3 py-2">
                        Intelligence Operations
                    </div>

                    {navigationItems.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative group ${
                                    isActive
                                        ? 'bg-white/10 text-white shadow-card'
                                        : 'text-textSecondary hover:text-white hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={isActive ? 'text-neonCyan' : 'text-textMuted group-hover:text-white transition-colors'}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </div>

                                {item.badge && (
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                        item.badge === 'Critical'
                                            ? 'bg-cyberRose/20 text-cyberRose border border-cyberRose/30'
                                            : item.badge === '3 Active'
                                            ? 'bg-neonPurple/20 text-neonPurple border border-neonPurple/30'
                                            : 'bg-white/5 text-textMuted'
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}

                                {isActive && (
                                    <motion.div
                                        layoutId="activeNavIndicator"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-neonCyan rounded-r-full shadow-glow-cyan"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Engine Telemetry Status */}
                <div className="p-4 border-t border-cardBorder space-y-3 bg-black/20">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${healthStatus === 'online' ? 'bg-cyberEmerald animate-pulse shadow-glow-emerald' : 'bg-cyberAmber'}`} />
                            <span className="text-textSecondary font-medium">Engine Mode</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-white uppercase">
                            {healthStatus === 'online' ? 'FastAPI Live' : 'Simulated Engine'}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[11px] font-mono text-textMuted">
                        <div className="flex justify-between">
                            <span>Neo4j Graph:</span>
                            <span className="text-neonPurple font-bold">5.20 Bolt</span>
                        </div>
                        <div className="flex justify-between">
                            <span>PyG GNN:</span>
                            <span className="text-neonCyan font-bold">GraphSAGE</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Application Content Body */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Viewport View */}
                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="h-full"
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Slide-Over Detailed Investigation Drawer */}
                <AnimatePresence>
                    {selectedTxId && (
                        <TransactionDetail
                            txId={selectedTxId}
                            onClose={() => setSelectedTxId(null)}
                            onNavigateCustomer={handleNavigateCustomer}
                            onNavigateRing={handleNavigateRing}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default App;
