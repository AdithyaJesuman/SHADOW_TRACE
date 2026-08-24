import React, { useState } from 'react';
import { Activity, ShieldAlert, LayoutDashboard, Database, ActivitySquare, ShieldCheck } from 'lucide-react';
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
        <div className="p-8 flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
                <div className="text-6xl mb-6 animate-pulse opacity-50">🚧</div>
                <h2 className="text-2xl font-bold text-slate-300">{title}</h2>
                <p className="text-sm mt-3 text-slate-500">This module is under construction.</p>
            </div>
        </div>
    );
}

function App() {
    const [activeView, setActiveView] = useState('overview');

    return (
        <div className="flex h-screen bg-slate-950 font-sans text-slate-200 selection:bg-indigo-500/30">
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 shadow-2xl z-10 relative">
                
                <div className="p-6 border-b border-slate-800/60 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-100 tracking-wide">SHADOW TRACE</div>
                            <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-medium mt-0.5">Fraud Engine</div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Main Menu</div>
                    {Object.entries(views).map(([key, { label, icon }]) => (
                        <button
                            key={key}
                            onClick={() => setActiveView(key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activeView === key
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                            }`}
                        >
                            <span className={activeView === key ? 'text-indigo-400' : 'text-slate-500'}>{icon}</span>
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                        <span className="text-slate-400">System Online</span>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-2 font-mono">
                        API: localhost:8000
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                <main className="h-full">
                    {views[activeView].component}
                </main>
            </div>
        </div>
    );
}

export default App;
