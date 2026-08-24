import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldAlert, DollarSign, Users } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
    
    const COLORS = ['#25c6e5', '#f320b9', '#9b51e0', '#3b82f6', '#8b5cf6'];

    const StatCard = ({ title, value, icon, trend, subtext, variant }) => {
        if (variant === 'gradient-purple') {
            return (
                <motion.div 
                    variants={itemVariants} 
                    whileHover={{ scale: 1.05, y: -5, rotateX: 5, rotateY: 5, boxShadow: "0px 20px 40px rgba(155, 81, 224, 0.4)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="bg-gradient-to-br from-[#d869ff] to-[#b558f6] rounded-2xl p-6 shadow-lg shadow-neonPurple/20 text-white relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-white/90 font-medium text-sm">{title}</span>
                    </div>
                    <div className="text-4xl font-bold tracking-tight relative z-10">{value}</div>
                    {subtext && <p className="text-white/70 text-xs mt-2 relative z-10">{subtext}</p>}
                    <motion.div 
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 right-0 p-4 opacity-20 transform scale-150 -translate-y-4 translate-x-4"
                    >
                        {icon}
                    </motion.div>
                </motion.div>
            );
        }
        
        if (variant === 'gradient-cyan') {
            return (
                <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -5, rotateX: 5, rotateY: -5, boxShadow: "0px 20px 40px rgba(37, 198, 229, 0.4)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="bg-gradient-to-br from-[#00f0ff] to-[#0080ff] rounded-2xl p-6 shadow-lg shadow-neonCyan/20 text-white relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-white/90 font-medium text-sm">{title}</span>
                    </div>
                    <div className="text-4xl font-bold tracking-tight relative z-10">{value}</div>
                    {subtext && <p className="text-white/70 text-xs mt-2 relative z-10">{subtext}</p>}
                    <motion.div 
                        initial={{ rotate: 0 }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 right-0 p-4 opacity-20 transform scale-150 -translate-y-4 translate-x-4"
                    >
                        {icon}
                    </motion.div>
                </motion.div>
            );
        }

        return (
            <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2, boxShadow: "0px 10px 20px rgba(0,0,0,0.4)" }}
                className="bg-cardBg rounded-2xl p-6 flex flex-row items-center justify-between shadow-lg"
            >
                <div className="flex items-center gap-4">
                    <motion.div 
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 bg-darkBg rounded-full text-neonPink shadow-[0_0_15px_rgba(243,32,185,0.2)]"
                    >
                        {icon}
                    </motion.div>
                    <div>
                        <h3 className="text-white font-medium text-sm">{title}</h3>
                        <p className="text-textMuted text-xs mt-1">{value}</p>
                    </div>
                </div>
                {trend && (
                    <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded-md text-textMuted">
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </motion.div>
        );
    };

    return (
        <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="max-w-7xl mx-auto space-y-6"
        >
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Volume" 
                    value={`$${totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                    icon={<DollarSign size={40} />} 
                    variant="gradient-purple"
                />
                <StatCard 
                    title="Active Alerts" 
                    value={flaggedCount} 
                    icon={<ShieldAlert size={40} />} 
                    variant="gradient-cyan"
                />
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard 
                        title="Fraud Rate" 
                        value={`${fraudRate.toFixed(1)}%`} 
                        icon={<Activity size={20} />} 
                        trend={-2.5}
                        variant="dark"
                    />
                    <StatCard 
                        title="Unique Users" 
                        value={new Set(txs.map(t => t.customer_id)).size} 
                        icon={<Users size={20} />} 
                        trend={+12}
                        variant="dark"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-cardBg rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow">
                    <h3 className="text-sm font-semibold text-white mb-6">Transactions vs Risk</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#25c6e5" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#25c6e5" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f320b9" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#f320b9" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3040" vertical={false} />
                                <XAxis dataKey="time" stroke="#a0a3bd" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#a0a3bd" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1d27', borderColor: '#2d3040', borderRadius: '0.5rem', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#25c6e5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                                <Area type="monotone" dataKey="risk" stroke="#f320b9" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Donut Chart */}
                <motion.div variants={itemVariants} className="bg-cardBg rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow">
                    <h3 className="text-sm font-semibold text-white mb-6">Transaction Types</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
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
                                    contentStyle={{ backgroundColor: '#1a1d27', borderColor: '#2d3040', borderRadius: '0.5rem', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-3 mt-4 px-4">
                            {typeData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between text-xs text-textMuted">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-cardBg" style={{ backgroundColor: 'transparent', borderColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="capitalize">{entry.name}</span>
                                    </div>
                                    <span className="text-white font-medium">{Math.round((entry.value / txs.length) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
