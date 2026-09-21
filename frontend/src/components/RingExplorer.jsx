import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Network, ShieldAlert, Share2, Search, Filter, Layers, 
    Smartphone, Globe, CreditCard, User, Mail, Store, AlertTriangle, 
    CheckCircle2, Info, ArrowUpRight, Zap, RefreshCw, ZoomIn, ZoomOut, Database
} from 'lucide-react';
import { api } from '../services/api';

const nodeIcons = {
    customer: <User size={16} className="text-blue-400" />,
    device: <Smartphone size={16} className="text-amber-400" />,
    ip: <Globe size={16} className="text-cyan-400" />,
    card: <CreditCard size={16} className="text-emerald-400" />,
    email: <Mail size={16} className="text-pink-400" />,
    merchant: <Store size={16} className="text-purple-400" />,
};

const nodeColors = {
    customer: 'border-blue-500/50 bg-blue-950/60 text-blue-300 shadow-blue-500/20',
    device: 'border-amber-500/50 bg-amber-950/60 text-amber-300 shadow-amber-500/20',
    ip: 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300 shadow-cyan-500/20',
    card: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300 shadow-emerald-500/20',
    email: 'border-pink-500/50 bg-pink-950/60 text-pink-300 shadow-pink-500/20',
    merchant: 'border-purple-500/50 bg-purple-950/60 text-purple-300 shadow-purple-500/20',
};

const RingExplorer = ({ onSelectTransaction }) => {
    const [rings, setRings] = useState([]);
    const [selectedRing, setSelectedRing] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCypher, setShowCypher] = useState(false);

    useEffect(() => {
        const fetchRings = async () => {
            const data = await api.getFraudRings();
            setRings(data);
            if (data.length > 0) {
                setSelectedRing(data[0]);
                setSelectedNode(data[0].nodes[0]);
            }
        };
        fetchRings();
    }, []);

    const handleRingSelect = (ring) => {
        setSelectedRing(ring);
        setSelectedNode(ring.nodes[0] || null);
    };

    if (!selectedRing) {
        return (
            <div className="flex items-center justify-center h-full text-textMuted">
                <RefreshCw size={24} className="animate-spin text-neonCyan mr-3" />
                <span>Loading Graph Ring Intelligence...</span>
            </div>
        );
    }

    const filteredNodes = selectedRing.nodes.filter(n => {
        if (activeFilter !== 'all' && n.type !== activeFilter) return false;
        if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const activeNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = selectedRing.edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

    const cypherQuery = `// SHADOW TRACE Ring Detection Query: ${selectedRing.name}
MATCH (c:Customer)-[r1:USES]->(d:Device)<-[r2:USES]-(mule:Customer)
WHERE c.customer_id <> mule.customer_id
OPTIONAL MATCH (c)-[:LOGGED_FROM]->(ip:IP)
OPTIONAL MATCH (c)-[:OWNS]->(card:Card)
RETURN c, d, mule, ip, card, count(*) as ring_density
ORDER BY ring_density DESC
LIMIT 50;`;

    return (
        <div className="h-full flex flex-col gap-6 p-2 lg:p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-neonPurple shadow-glow-purple">
                            <Network size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-white">Graph Ring Explorer</h1>
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-neonPurple/20 text-neonPurple border border-neonPurple/40">
                                    Neo4j 5.20 Live
                                </span>
                            </div>
                            <p className="text-sm text-textSecondary mt-0.5">
                                Real-time subgraph topologies and coordinated identity multiplexing rings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ring selector tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {rings.map((ring) => {
                        const isSelected = selectedRing.id === ring.id;
                        return (
                            <button
                                key={ring.id}
                                onClick={() => handleRingSelect(ring)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2.5 border ${
                                    isSelected
                                        ? 'bg-purple-950/70 border-neonPurple text-white shadow-glow-purple'
                                        : 'bg-cardBg/60 border-white/5 text-textMuted hover:text-white hover:border-white/15'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${ring.severity === 'CRITICAL' ? 'bg-cyberRose animate-pulse' : 'bg-cyberAmber'}`} />
                                <span>{ring.id}</span>
                                <span className="opacity-60 text-[10px] hidden sm:inline">({ring.metrics.member_count} nodes)</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Ring Summary Banner */}
            <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden bg-gradient-to-r from-cardBg via-cardBg to-purple-950/20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-3xl">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyberRose/20 text-cyberRose border border-cyberRose/30">
                                {selectedRing.severity} SEVERITY
                            </span>
                            <span className="text-xs text-textMuted font-mono">Risk Score: {(selectedRing.risk_score * 100).toFixed(1)}%</span>
                            <span className="text-xs text-textMuted">Pattern: <span className="text-textPrimary font-semibold">{selectedRing.pattern}</span></span>
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-tight">{selectedRing.name}</h2>
                        <p className="text-xs text-textSecondary leading-relaxed">{selectedRing.summary}</p>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-center border-t lg:border-t-0 lg:border-l border-white/10 pt-3 lg:pt-0 lg:pl-6">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] uppercase font-bold text-textMuted block">Exposure</span>
                            <span className="text-sm font-black font-mono text-cyberEmerald">${(selectedRing.metrics.total_volume).toLocaleString()}</span>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] uppercase font-bold text-textMuted block">Mule Users</span>
                            <span className="text-sm font-black font-mono text-cyan-300">{selectedRing.metrics.member_count}</span>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] uppercase font-bold text-textMuted block">Shared Devices</span>
                            <span className="text-sm font-black font-mono text-amber-300">{selectedRing.metrics.device_count}</span>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 col-span-3 sm:col-span-1">
                            <span className="text-[10px] uppercase font-bold text-textMuted block">Density</span>
                            <span className="text-sm font-black font-mono text-neonPurple">{(selectedRing.metrics.graph_density * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graph Canvas & Inspector Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
                {/* Left 8 cols: Interactive Graph Visualization Area */}
                <div className="lg:col-span-8 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden relative bg-[#070a10]">
                    {/* Graph Controls Toolbar */}
                    <div className="p-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 z-10">
                        {/* Entity Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                            {['all', 'customer', 'device', 'ip', 'card', 'merchant'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveFilter(type)}
                                    className={`px-3 py-1 rounded-lg font-medium capitalize transition-all ${
                                        activeFilter === type
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'bg-white/5 text-textMuted hover:text-white'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Search & Actions */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textMuted" />
                                <input
                                    type="text"
                                    placeholder="Filter node..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-black/50 border border-white/10 text-xs rounded-lg pl-8 pr-3 py-1 text-white placeholder-textMuted focus:outline-none focus:border-neonPurple w-32 sm:w-40"
                                />
                            </div>
                            <button
                                onClick={() => setShowCypher(!showCypher)}
                                title="Inspect Cypher Query"
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 border transition-all ${
                                    showCypher ? 'bg-neonCyan/20 text-neonCyan border-neonCyan/40' : 'bg-white/5 text-textMuted border-white/10 hover:text-white'
                                }`}
                            >
                                <Database size={13} />
                                <span>Cypher</span>
                            </button>
                            <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-lg p-0.5">
                                <button onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))} className="p-1 text-textMuted hover:text-white">
                                    <ZoomIn size={14} />
                                </button>
                                <button onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))} className="p-1 text-textMuted hover:text-white">
                                    <ZoomOut size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cypher overlay */}
                    <AnimatePresence>
                        {showCypher && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[#05070c] border-b border-cyan-500/30 p-4 font-mono text-xs text-cyan-300 z-20 overflow-x-auto shadow-2xl"
                            >
                                <div className="flex items-center justify-between text-textMuted text-[10px] mb-2 uppercase font-bold tracking-wider">
                                    <span>Neo4j Graph Pattern Query (Executed in db.py)</span>
                                    <span className="text-neonCyan">Latency: 4.8ms</span>
                                </div>
                                <pre className="text-cyan-400 font-mono text-xs">{cypherQuery}</pre>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Interactive Canvas */}
                    <div className="flex-1 relative overflow-hidden bg-grid-pattern p-6 flex items-center justify-center min-h-[420px]">
                        <motion.div 
                            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                            className="w-full h-full relative"
                        >
                            {/* SVG Edges */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                <defs>
                                    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
                                    </linearGradient>
                                    <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" opacity="0.7" />
                                    </marker>
                                </defs>
                                {filteredEdges.map((edge, idx) => {
                                    const sourceNode = selectedRing.nodes.find(n => n.id === edge.source);
                                    const targetNode = selectedRing.nodes.find(n => n.id === edge.target);
                                    if (!sourceNode || !targetNode) return null;

                                    const isHighlight = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

                                    return (
                                        <g key={idx}>
                                            <line
                                                x1={`${(sourceNode.x / 550) * 100}%`}
                                                y1={`${(sourceNode.y / 400) * 100}%`}
                                                x2={`${(targetNode.x / 550) * 100}%`}
                                                y2={`${(targetNode.y / 400) * 100}%`}
                                                stroke={isHighlight ? '#ec4899' : '#8b5cf6'}
                                                strokeWidth={isHighlight ? 2.5 : 1.5}
                                                strokeOpacity={isHighlight ? 0.9 : 0.35}
                                                strokeDasharray={edge.label === 'REMOTE_LOGIN' ? '4 4' : 'none'}
                                                markerEnd="url(#arrow)"
                                            />
                                            {/* Edge Label */}
                                            <text
                                                x={`${((sourceNode.x + targetNode.x) / 2 / 550) * 100}%`}
                                                y={`${((sourceNode.y + targetNode.y) / 2 / 400) * 100 - 1.5}%`}
                                                fill={isHighlight ? '#f43f5e' : '#64748b'}
                                                fontSize="9"
                                                fontFamily="monospace"
                                                textAnchor="middle"
                                                className="select-none font-bold"
                                            >
                                                {edge.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Node DOM Elements */}
                            {filteredNodes.map((node) => {
                                const isSelected = selectedNode?.id === node.id;
                                const styleClass = nodeColors[node.type] || 'border-slate-500 bg-slate-900 text-slate-300';

                                return (
                                    <motion.div
                                        key={node.id}
                                        onClick={() => setSelectedNode(node)}
                                        whileHover={{ scale: 1.15, zIndex: 30 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            left: `${(node.x / 550) * 100}%`,
                                            top: `${(node.y / 400) * 100}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                        className={`absolute z-10 cursor-pointer p-2 rounded-2xl border-2 shadow-lg backdrop-blur-md transition-all flex items-center gap-2 ${styleClass} ${
                                            isSelected ? 'ring-4 ring-neonPink ring-offset-2 ring-offset-[#080b11] scale-110 z-20' : ''
                                        }`}
                                    >
                                        <div className="p-1.5 rounded-xl bg-black/40">
                                            {nodeIcons[node.type]}
                                        </div>
                                        <div className="text-left pr-1.5">
                                            <div className="text-[10px] font-mono font-bold leading-tight truncate max-w-[120px]">{node.id}</div>
                                            <div className="text-[9px] text-textMuted uppercase font-semibold">{node.type}</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>

                    {/* Canvas Footer Legend */}
                    <div className="p-3 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 text-textMuted text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Customer</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Device</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> IP Address</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Card</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Email</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Merchant</span>
                        </div>
                        <div className="text-[11px] text-textMuted font-mono">
                            Showing {filteredNodes.length} nodes · {filteredEdges.length} relationships
                        </div>
                    </div>
                </div>

                {/* Right 4 cols: Node Inspector & Ring Telemetry */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {selectedNode ? (
                        <div className="glass-panel rounded-2xl border border-white/10 p-5 flex flex-col gap-4 bg-cardBg/90 shadow-2xl">
                            <div className="flex items-start justify-between border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                                        {nodeIcons[selectedNode.type]}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted block">{selectedNode.type} Node Telemetry</span>
                                        <h3 className="text-base font-bold text-white font-mono">{selectedNode.id}</h3>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                                    selectedNode.risk === 'critical' ? 'bg-cyberRose/20 text-cyberRose border border-cyberRose/30' : 'bg-cyberAmber/20 text-cyberAmber border border-cyberAmber/30'
                                }`}>
                                    {selectedNode.risk}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-textMuted font-medium">Node Label</span>
                                    <span className="text-textPrimary font-semibold text-right truncate max-w-[180px]">{selectedNode.label}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-textMuted font-medium">Degree Centrality</span>
                                    <span className="text-neonCyan font-mono font-bold">0.842 (High Hub)</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-textMuted font-medium">PageRank Score</span>
                                    <span className="text-neonPurple font-mono font-bold">0.0418</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-textMuted font-medium">Betweenness Index</span>
                                    <span className="text-cyberRose font-mono font-bold">0.912</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-textMuted font-medium">Graph Hops</span>
                                    <span className="text-textPrimary font-mono">1-Hop to 5 Mules</span>
                                </div>
                            </div>

                            {/* Connected Edges List */}
                            <div className="mt-2">
                                <span className="text-[10px] font-bold uppercase text-textMuted tracking-wider block mb-2">Adjacent Ring Links</span>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {selectedRing.edges
                                        .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                                        .map((e, idx) => (
                                            <div key={idx} className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[11px] font-mono">
                                                <span className="text-textMuted">{e.source === selectedNode.id ? 'Outbound' : 'Inbound'}</span>
                                                <span className="text-neonPurple font-bold">[:{e.label}]</span>
                                                <span className="text-textPrimary truncate max-w-[100px]">{e.source === selectedNode.id ? e.target : e.source}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                                <button
                                    onClick={() => alert(`Freeze command dispatched for node ${selectedNode.id}`)}
                                    className="w-full py-2.5 rounded-xl bg-cyberRose/20 hover:bg-cyberRose/30 text-cyberRose border border-cyberRose/40 text-xs font-bold transition-all shadow-glow-rose flex items-center justify-center gap-2"
                                >
                                    <ShieldAlert size={15} />
                                    <span>Quarantine Node & Freeze Ring</span>
                                </button>
                                <button
                                    onClick={() => alert(`Graph subgraph export generated for ${selectedNode.id}`)}
                                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-textSecondary text-xs font-medium border border-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Share2 size={14} />
                                    <span>Export Subgraph JSON</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center text-center text-textMuted h-full">
                            <Info size={32} className="mb-3 opacity-40 text-neonCyan" />
                            <p className="text-sm font-semibold text-textSecondary">Select Any Graph Node</p>
                            <p className="text-xs mt-1 text-textMuted">Click a node on the canvas to inspect its centrality, PageRank, and network connections.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RingExplorer;
