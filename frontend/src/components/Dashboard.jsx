import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldAlert, DollarSign, Users } from 'lucide-react';

const Dashboard = () => {
    const [txs, setTxs] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch more for stats
                const data = await api.getTransactions(100);
                setTxs(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
        const int = setInterval(fetchStats, 5000);
        return () => clearInterval(int);
    }, []);

    // Derived Stats
    const totalVolume = txs.reduce((acc, curr) => acc + curr.amount, 0);
    const flaggedCount = txs.filter(t => t.is_flagged).length;
    const fraudRate = txs.length ? (flaggedCount / txs.length) * 100 : 0;
    
    // Chart Data formatting
    const timeData = [...txs].reverse().map(t => ({
        time: new Date(t.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' }),
        amount: t.amount,
        risk: t.is_fraud ? 90 : Math.random() * 20
    }));

    const typeData = txs.reduce((acc, curr) => {
        const existing = acc.find(x => x.name === curr.tx_type);
        if (existing) existing.value += 1;
        else acc.push({ name: curr.tx_type || 'other', value: 1 });
        return acc;
    }, []);
    
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

    const StatCard = ({ title, value, icon, trend, subtext, color }) => {
        const colorMap = {
            indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', glow: 'bg-indigo-500/10' },
            rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', glow: 'bg-rose-500/10' },
            amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'bg-amber-500/10' },
            emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'bg-emerald-500/10' },
        };
        const c = colorMap[color] || colorMap.indigo;

        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 ${c.glow} rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50`}></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-2 ${c.bg} border ${c.border} rounded-lg ${c.text}`}>
                        {icon}
                    </div>
                    {trend && (
                        <span className={`text-xs font-bold ${trend > 0 ? 'text-rose-400' : 'text-emerald-400'} bg-slate-950 px-2 py-1 rounded-md border border-slate-800`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-black text-slate-100 tracking-tight">{value}</h3>
                    <p className="text-slate-400 text-sm font-medium mt-1">{title}</p>
                    {subtext && <p className="text-slate-500 text-xs mt-3">{subtext}</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Overview</h2>
                <p className="text-slate-400 mt-1">System telemetry and risk metrics</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    title="Volume (Last 100)" 
                    value={`$${totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                    icon={<DollarSign size={20} />} 
                    color="indigo"
                />
                <StatCard 
                    title="Active Alerts" 
                    value={flaggedCount} 
                    icon={<ShieldAlert size={20} />} 
                    color="rose"
                    trend={+12.5}
                />
                <StatCard 
                    title="Fraud Rate" 
                    value={`${fraudRate.toFixed(1)}%`} 
                    icon={<Activity size={20} />} 
                    color="amber"
                />
                <StatCard 
                    title="Unique Users" 
                    value={new Set(txs.map(t => t.customer_id)).size} 
                    icon={<Users size={20} />} 
                    color="emerald"
                    subtext="Distinct customers in window"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">Transaction Volume & Risk</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                                <Area type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">Transaction Types</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                            {typeData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
