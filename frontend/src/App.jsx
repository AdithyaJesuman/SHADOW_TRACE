import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, LayoutDashboard, Database, ActivitySquare, ShieldCheck, Sparkles } from 'lucide-react';
import LiveFeed from './components/LiveFeed';
import ReviewQueue from './components/ReviewQueue';
import Dashboard from './components/Dashboard';

const views = {
    overview: { label: 'Overview', icon: <LayoutDashboard size={18} />, component: <Dashboard /> },
    feed: { label: 'Live Stream', icon: <Activity size={18} />, component: <LiveFeed /> },
    queue: { label: 'Review Queue', icon: <ShieldAlert size={18} />, component: <ReviewQueue /> },
    customers: { label: 'Profiles', icon: <Database size={18} />, component: <ComingSoon title="Customer Profiles" /> },
    metrics: { label: 'Model Metrics', icon: <ActivitySquare size={18} />, component: <ComingSoon title="Model Performance" /> },
};

function ComingSoon({ title }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="p-8 flex items-center justify-center h-full"
        >
            <div className="text-center text-slate-500">
                <div className="text-6xl mb-6 animate-pulse opacity-50">🚧</div>
                <h2 className="text-2xl font-bold text-slate-300">{title}</h2>
                <p className="text-sm mt-3 text-slate-500">This module is under construction.</p>
            </div>
        </motion.div>
    );
}

function App() {
    const [activeView, setActiveView] = useState('overview');

    return (
        <div className="flex h-screen bg-darkBg font-sans text-white selection:bg-neonPink/30 overflow-hidden">
            <motion.div 
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="w-64 bg-sidebarBg flex flex-col flex-shrink-0 shadow-2xl z-20 relative border-r border-white/5"
            >
                <div className="p-6">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <div className="p-2 bg-gradient-to-tr from-neonPurple to-neonPink rounded-xl shadow-[0_0_20px_rgba(243,32,185,0.4)]">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight">SHADOW CRM</div>
                        </div>
                    </motion.div>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto mt-4 px-2">
                    <div className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-3 px-4">Menu</div>
                    {Object.entries(views).map(([key, { label, icon }], idx) => (
                        <motion.button
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (idx * 0.1) }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveView(key)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${
                                activeView === key
                                    ? 'text-white'
                                    : 'text-textMuted hover:text-white'
                            }`}
                        >
                            {activeView === key && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-neonPurple/40 to-transparent border-l-4 border-neonPurple rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className={`relative z-10 ${activeView === key ? 'text-neonPink drop-shadow-[0_0_8px_rgba(243,32,185,0.8)]' : 'text-textMuted'}`}>{icon}</span>
                            <span className="relative z-10">{label}</span>
                        </motion.button>
                    ))}
                </nav>

                <div className="p-6">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 text-xs bg-black/20 p-3 rounded-xl border border-white/5"
                    >
                        <div className="w-2 h-2 rounded-full bg-neonCyan shadow-[0_0_10px_rgba(37,198,229,1)] animate-pulse"></div>
                        <span className="text-textMuted font-medium tracking-wide">System Online</span>
                    </motion.div>
                </div>
            </motion.div>

            <div className="flex-1 overflow-auto bg-darkBg relative z-10">
                <main className="h-full p-8 perspective-1000">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, rotateX: 10, y: 20 }}
                            animate={{ opacity: 1, rotateX: 0, y: 0 }}
                            exit={{ opacity: 0, rotateX: -10, y: -20 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="h-full"
                        >
                            {views[activeView].component}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

export default App;
