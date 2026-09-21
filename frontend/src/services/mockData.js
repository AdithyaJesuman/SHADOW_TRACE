// SHADOW TRACE - Realistic Mock Intelligence Data Generator & Schema Mirror

const firstNames = ['Alexander', 'Marcus', 'Elena', 'Sophia', 'Victor', 'Dmitri', 'Sarah', 'Chen', 'Amira', 'Julian', 'Kaito', 'Liam', 'Zoe', 'Fatima', 'Nikolai'];
const lastNames = ['Vance', 'Sterling', 'Rostova', 'Kim', 'Patel', 'Novak', 'Dubois', 'Zhao', 'Al-Mansoor', 'O\'Connor', 'Tanaka', 'Kowalski', 'Moreau', 'Silva'];
const merchants = ['M_SteamGames_992', 'M_AppleStore_104', 'M_BinanceP2P_801', 'M_AmazonPrime_442', 'M_DarkWebRelay_09', 'M_StripeEscrow_33', 'M_UberEats_12', 'M_CoinbasePro_77'];
const types = ['TRANSFER', 'PAYMENT', 'CASH_OUT', 'DEBIT', 'WIRE_FAST'];
const browsers = ['Chrome 124.0.0', 'Firefox 126.0', 'Safari 17.4', 'Tor Browser 13.5', 'Brave 1.66', 'HeadlessChrome'];
const osList = ['Windows 11', 'macOS Sonoma', 'Linux Ubuntu 22.04', 'iOS 17.5', 'Android 14', 'Tails OS'];
const countries = [
    { code: 'US', name: 'United States', risk: 'low' },
    { code: 'DE', name: 'Germany', risk: 'low' },
    { code: 'SG', name: 'Singapore', risk: 'low' },
    { code: 'RU', name: 'Russia', risk: 'high' },
    { code: 'NG', name: 'Nigeria', risk: 'high' },
    { code: 'RO', name: 'Romania', risk: 'elevated' },
    { code: 'KY', name: 'Cayman Islands', risk: 'high' },
    { code: 'BR', name: 'Brazil', risk: 'elevated' },
];

export const generateMockTransactions = (count = 25) => {
    const list = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const isFraud = Math.random() > 0.78;
        const fraudScore = isFraud ? (0.72 + Math.random() * 0.26) : (Math.random() * 0.28);
        const amount = isFraud ? (1400 + Math.random() * 18500) : (15 + Math.random() * 650);
        const country = countries[Math.floor(Math.random() * countries.length)];
        const isVpn = isFraud || Math.random() > 0.85;
        const isTor = isFraud && Math.random() > 0.5;

        list.push({
            tx_id: `TX-${(1000000 + i * 482 + Math.floor(Math.random() * 800)).toString(16).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
            customer_id: `C${1000000 + (i % 8) * 1142 + (isFraud ? 99 : i * 3)}`,
            merchant_id: merchants[Math.floor(Math.random() * merchants.length)],
            amount: Number(amount.toFixed(2)),
            tx_type: types[Math.floor(Math.random() * types.length)],
            is_fraud: isFraud,
            is_flagged: isFraud || fraudScore > 0.65,
            fraud_score: Number(fraudScore.toFixed(3)),
            risk_level: fraudScore > 0.7 ? 'HIGH' : (fraudScore > 0.3 ? 'ELEVATED' : 'NORMAL'),
            timestamp: new Date(now - i * (20000 + Math.random() * 45000)).toISOString(),
            ip_address: isTor ? `185.220.101.${Math.floor(Math.random() * 250)}` : `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 250)}`,
            country: country.code,
            vpn_flag: isVpn,
            tor_flag: isTor,
            device_info: `${osList[i % osList.length]} / ${browsers[i % browsers.length]}`,
            card_network: ['VISA Platinum', 'Mastercard World Elite', 'AMEX Centurion', 'Crypto Debit'][i % 4],
            card_fingerprint: `FINGERPRINT-${(892019 + i * 77).toString(16).toUpperCase()}`,
            top_features: isFraud ? [
                { feature: 'shared_device_count', contribution: 0.42, label: '3+ Accounts on same Device ID' },
                { feature: 'tx_velocity_1h', contribution: 0.28, label: 'Velocity: 14 txns in 1 hour' },
                { feature: 'tor_exit_node', contribution: 0.18, label: 'Tor Exit Node / Darknet relay' }
            ] : [
                { feature: 'known_device_match', contribution: 0.04, label: 'Trusted device history (320 days)' },
                { feature: 'geo_velocity_normal', contribution: 0.02, label: 'Domestic location match' }
            ]
        });
    }

    return list;
};

export const generateMockFlagged = (count = 30) => {
    return generateMockTransactions(count)
        .map(t => ({
            ...t,
            is_fraud: true,
            is_flagged: true,
            fraud_score: Number((0.74 + Math.random() * 0.24).toFixed(3)),
            risk_level: 'HIGH'
        }));
};

export const generateMockDetail = (txId) => {
    return {
        tx_id: txId || 'TX-89FA2B-4491',
        customer_id: 'C1045892',
        merchant_id: 'M_BinanceP2P_801',
        amount: 8450.00,
        tx_type: 'TRANSFER',
        is_fraud: true,
        is_flagged: true,
        fraud_score: 0.942,
        risk_level: 'CRITICAL',
        timestamp: new Date(Date.now() - 140000).toISOString(),
        customer: {
            customer_id: 'C1045892',
            external_id: 'U0012483',
            name: 'Alexander Sterling',
            account_age_days: 14,
            risk_score: 0.92,
            total_tx_count: 87,
            total_volume_usd: 148500,
            status: 'RESTRICTED_REVIEW'
        },
        device: {
            device_id: 'D_8F3A2B',
            device_info: 'Linux Ubuntu 22.04 / Headless Chrome 124.0.0',
            device_type: 'Desktop Automation',
            os: 'Linux Ubuntu',
            browser: 'HeadlessChrome / Puppeteer',
            screen_res: '1920x1080x24',
            fingerprint_hash: '9f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
            shared_user_count: 5,
            is_emulator: true
        },
        ip: {
            ip_id: 'IP_99214',
            ip_address: '185.220.101.42',
            country: 'RU',
            city: 'Saint Petersburg',
            isp: 'Tor Relay Network',
            vpn_flag: true,
            tor_flag: true,
            datacenter_flag: true,
            fraud_history_score: 0.98
        },
        card: {
            card_id: 'CRD_9482',
            card_fingerprint: 'CRD-FPR-449182',
            card_network: 'Mastercard World Elite',
            card_category: 'Virtual Prepaid',
            issuer_bank: 'Revolut UK Limited',
            bin_country: 'GB',
            shared_with_accounts: 3
        },
        merchant: {
            merchant_id: 'M_BinanceP2P_801',
            category: 'Cryptocurrency P2P Escrow',
            country: 'MT',
            risk_tier: 'High Risk MCC'
        },
        features: {
            c1: 14.0, c2: 8.0, c3: 0.0, c4: 12.0, c5: 0.0, c6: 9.0, c7: 0.0, c8: 4.0, c9: 1.0, c10: 14.0, c11: 3.0, c12: 2.0, c13: 18.0, c14: 6.0,
            d1: 14.0, d2: 0.0, d3: 1.0, d4: 0.0, d5: 0.0, d10: 0.0, d15: 14.0,
            m1: 'T', m2: 'F', m3: 'F', m4: 'M2', m5: 'F', m6: 'T', m7: 'F', m8: 'F', m9: 'F',
            tx_velocity_1h: 18,
            balance_drain_ratio: 0.96,
            shared_device_count: 5,
            shared_ip_count: 4,
            pagerank_centrality: 0.0482,
            betweenness_score: 0.884,
            fraud_neighbor_ratio: 0.833,
            night_pattern_ratio: 0.91
        },
        shap_explanations: [
            { feature: 'shared_device_count (5 users)', contribution: 0.38, impact: 'Positive Risk Drive (+38%)' },
            { feature: 'tx_velocity_1h (18 txns/hr)', contribution: 0.27, impact: 'Positive Risk Drive (+27%)' },
            { feature: 'tor_exit_node (185.220.101.42)', contribution: 0.18, impact: 'Positive Risk Drive (+18%)' },
            { feature: 'balance_drain_ratio (96% drained in 1 hr)', contribution: 0.11, impact: 'Positive Risk Drive (+11%)' }
        ],
        ring_context: {
            ring_id: 'RING-FR-802',
            ring_type: 'Coordinated Shared Device & Mule Cluster',
            members: ['U0012483', 'U0019234', 'U0045821', 'U0078192', 'U0099412'],
            total_stolen_estimate: '$148,500 USD',
            state: 'ACTIVE_INTERCEPT'
        }
    };
};

export const mockFraudRings = [
    {
        id: 'RING-FR-802',
        name: 'Operation Hydra - Headless Chrome Mule Ring',
        severity: 'CRITICAL',
        risk_score: 0.96,
        pattern: 'Shared Device & Disposable Identity Takeover',
        detected_at: '2026-09-04T22:15:00Z',
        summary: '5 customer accounts multiplexing through a single Ubuntu VM running Puppeteer headless browser to rapidly cash out virtual debit cards via P2P crypto exchanges.',
        metrics: {
            total_volume: 148500,
            member_count: 5,
            device_count: 1,
            ip_count: 2,
            card_count: 3,
            graph_density: 0.88
        },
        nodes: [
            { id: 'U0012483', label: 'Alexander Sterling (U0012483)', type: 'customer', risk: 'critical', x: 200, y: 150 },
            { id: 'U0019234', label: 'Mule User B (U0019234)', type: 'customer', risk: 'critical', x: 280, y: 80 },
            { id: 'U0045821', label: 'Mule User C (U0045821)', type: 'customer', risk: 'high', x: 380, y: 140 },
            { id: 'U0078192', label: 'Mule User D (U0078192)', type: 'customer', risk: 'high', x: 180, y: 260 },
            { id: 'U0099412', label: 'Mule User E (U0099412)', type: 'customer', risk: 'critical', x: 320, y: 270 },
            { id: 'D_8F3A2B', label: 'Device: Linux Puppeteer (D_8F3A2B)', type: 'device', risk: 'critical', x: 270, y: 180 },
            { id: 'IP_99214', label: 'IP: 185.220.101.42 (Tor Exit)', type: 'ip', risk: 'critical', x: 130, y: 180 },
            { id: 'CRD_9482', label: 'Card: Revolut Virtual #4491', type: 'card', risk: 'high', x: 420, y: 220 },
            { id: 'EML_TEMP', label: 'Domain: @tempmail-relay.cc', type: 'email', risk: 'high', x: 220, y: 340 },
            { id: 'M_BINANCE', label: 'Merchant: Binance P2P Escrow', type: 'merchant', risk: 'elevated', x: 440, y: 90 }
        ],
        edges: [
            { source: 'U0012483', target: 'D_8F3A2B', label: 'USES' },
            { source: 'U0019234', target: 'D_8F3A2B', label: 'USES' },
            { source: 'U0045821', target: 'D_8F3A2B', label: 'USES' },
            { source: 'U0078192', target: 'D_8F3A2B', label: 'USES' },
            { source: 'U0099412', target: 'D_8F3A2B', label: 'USES' },
            { source: 'U0012483', target: 'IP_99214', label: 'LOGGED_FROM' },
            { source: 'U0078192', target: 'IP_99214', label: 'LOGGED_FROM' },
            { source: 'U0045821', target: 'CRD_9482', label: 'OWNS' },
            { source: 'U0099412', target: 'CRD_9482', label: 'OWNS' },
            { source: 'U0012483', target: 'EML_TEMP', label: 'USES_EMAIL' },
            { source: 'U0099412', target: 'EML_TEMP', label: 'USES_EMAIL' },
            { source: 'U0019234', target: 'M_BINANCE', label: 'TRANSFER_TO' },
            { source: 'U0045821', target: 'M_BINANCE', label: 'TRANSFER_TO' }
        ]
    },
    {
        id: 'RING-FR-714',
        name: 'Shadow Card Testing Burst Network',
        severity: 'HIGH',
        risk_score: 0.89,
        pattern: 'Velocity Testing & Shared BIN Cluster',
        detected_at: '2026-09-04T18:40:00Z',
        summary: '32 micro-transactions executed within 90 seconds testing stolen card ranges across digital storefronts.',
        metrics: {
            total_volume: 89400,
            member_count: 4,
            device_count: 2,
            ip_count: 3,
            card_count: 7,
            graph_density: 0.76
        },
        nodes: [
            { id: 'U0033109', label: 'User Alpha (U0033109)', type: 'customer', risk: 'high', x: 200, y: 120 },
            { id: 'U0033110', label: 'User Beta (U0033110)', type: 'customer', risk: 'high', x: 340, y: 120 },
            { id: 'U0033111', label: 'User Gamma (U0033111)', type: 'customer', risk: 'high', x: 270, y: 250 },
            { id: 'D_IPHONE_CL', label: 'Device: Spoofed iPhone 15', type: 'device', risk: 'high', x: 270, y: 170 },
            { id: 'IP_VPN_NORD', label: 'IP: 89.187.162.14 (NordVPN)', type: 'ip', risk: 'high', x: 150, y: 210 },
            { id: 'M_STEAM', label: 'Merchant: Valve Steam Digital', type: 'merchant', risk: 'normal', x: 420, y: 180 }
        ],
        edges: [
            { source: 'U0033109', target: 'D_IPHONE_CL', label: 'USES' },
            { source: 'U0033110', target: 'D_IPHONE_CL', label: 'USES' },
            { source: 'U0033111', target: 'D_IPHONE_CL', label: 'USES' },
            { source: 'U0033109', target: 'IP_VPN_NORD', label: 'LOGGED_FROM' },
            { source: 'U0033110', target: 'M_STEAM', label: 'TX_PURCHASE' },
            { source: 'U0033111', target: 'M_STEAM', label: 'TX_PURCHASE' }
        ]
    },
    {
        id: 'RING-FR-601',
        name: 'Night Owl Escrow Drain Syndicate',
        severity: 'CRITICAL',
        risk_score: 0.94,
        pattern: 'Off-Hours High Balance Exfiltration',
        detected_at: '2026-09-04T03:12:00Z',
        summary: 'Synchronized account takeovers draining 90%+ balances between 2:00 AM and 4:30 AM via immediate wire transfers.',
        metrics: {
            total_volume: 294000,
            member_count: 6,
            device_count: 2,
            ip_count: 4,
            card_count: 2,
            graph_density: 0.91
        },
        nodes: [
            { id: 'U0088190', label: 'Drained Account A', type: 'customer', risk: 'critical', x: 180, y: 100 },
            { id: 'U0088191', label: 'Drained Account B', type: 'customer', risk: 'critical', x: 300, y: 100 },
            { id: 'U0088192', label: 'Drained Account C', type: 'customer', risk: 'critical', x: 240, y: 220 },
            { id: 'D_OFFSHORE', label: 'Device: VPS Windows Server', type: 'device', risk: 'critical', x: 240, y: 160 }
        ],
        edges: [
            { source: 'U0088190', target: 'D_OFFSHORE', label: 'REMOTE_LOGIN' },
            { source: 'U0088191', target: 'D_OFFSHORE', label: 'REMOTE_LOGIN' },
            { source: 'U0088192', target: 'D_OFFSHORE', label: 'REMOTE_LOGIN' }
        ]
    }
];

export const mockCustomerProfiles = {
    'U0012483': {
        customer_id: 'C1045892',
        external_id: 'U0012483',
        name: 'Alexander Sterling',
        email: 'alex.sterling@corp-relay.io',
        created_at: '2026-08-20T10:00:00Z',
        risk_score: 0.92,
        risk_tier: 'CRITICAL',
        is_fraud: true,
        stats: {
            lifetime_volume: 148500,
            transaction_count: 87,
            avg_ticket_size: 1706.89,
            flagged_count: 24,
            chargeback_rate: '18.4%'
        },
        linked_devices: [
            { device_id: 'D_8F3A2B', os: 'Linux Ubuntu', browser: 'HeadlessChrome', first_seen: '2026-08-21', shared_users: 5 },
            { device_id: 'D_9921AA', os: 'Windows 11', browser: 'Chrome 124', first_seen: '2026-08-20', shared_users: 1 }
        ],
        linked_cards: [
            { card_id: 'CRD_9482', network: 'Mastercard World Elite', last4: '4491', status: 'FROZEN_SUSPECT' },
            { card_id: 'CRD_1029', network: 'Revolut Virtual', last4: '8820', status: 'ACTIVE' }
        ],
        login_events: [
            { time: '2026-09-05T01:14:00Z', ip: '185.220.101.42 (Tor Exit)', country: 'RU', vpn: true, status: 'BLOCKED' },
            { time: '2026-09-04T18:30:00Z', ip: '192.168.1.1', country: 'US', vpn: false, status: 'SUCCESS' },
            { time: '2026-09-03T03:12:00Z', ip: '89.187.162.14', country: 'DE', vpn: true, status: 'FLAGGED' }
        ],
        predictions: [
            { prediction_id: 'PRED-9982', fraud_score: 0.942, risk_level: 'HIGH', scored_at: '2026-09-05T01:14:02Z', model_version: 'GraphSAGE-v2.3+XGBoost' },
            { prediction_id: 'PRED-9910', fraud_score: 0.891, risk_level: 'HIGH', scored_at: '2026-09-04T18:32:00Z', model_version: 'GraphSAGE-v2.3+XGBoost' },
            { prediction_id: 'PRED-8821', fraud_score: 0.210, risk_level: 'NORMAL', scored_at: '2026-08-20T10:15:00Z', model_version: 'GraphSAGE-v2.3+XGBoost' }
        ]
    }
};

export const mockModelMetrics = {
    summary: {
        gnn_architecture: 'PyG GraphSAGE (2-layer) + Node2Vec (128-dim)',
        classifier: 'XGBoost 2.0.3 + LightGBM Ensemble',
        anomaly_detectors: 'Isolation Forest (unsupervised) + HDBSCAN (clustering)',
        roc_auc: 0.9842,
        pr_auc: 0.9418,
        precision: 0.946,
        recall: 0.918,
        f1_score: 0.932,
        inference_latency_p50: '11.4 ms',
        inference_latency_p95: '24.8 ms',
        inference_latency_p99: '42.1 ms',
        model_version: 'SHADOW-GNN-PROD-2026.4',
        last_retrained: '2026-09-04T04:00:00Z'
    },
    feature_importance: [
        { feature: 'shared_device_count', importance: 0.284, category: 'Graph Topology' },
        { feature: 'tx_velocity_1h', importance: 0.212, category: 'Behavioral Velocity' },
        { feature: 'balance_drain_ratio', importance: 0.165, category: 'Financial Anomaly' },
        { feature: 'gnn_embedding_dim_42', importance: 0.128, category: 'GraphSAGE Embeddings' },
        { feature: 'pagerank_centrality', importance: 0.092, category: 'Graph Centrality' },
        { feature: 'tor_vpn_exit_flag', importance: 0.068, category: 'Network Geolocation' },
        { feature: 'night_burst_ratio', importance: 0.051, category: 'Temporal Pattern' }
    ],
    confusion_matrix: {
        true_positive: 18420,
        false_positive: 105,
        true_negative: 589200,
        false_negative: 1640
    },
    latency_history: [
        { time: '00:00', p50: 10.8, p95: 22.1 },
        { time: '04:00', p50: 11.2, p95: 23.4 },
        { time: '08:00', p50: 14.8, p95: 28.9 },
        { time: '12:00', p50: 13.9, p95: 26.2 },
        { time: '16:00', p50: 12.1, p95: 24.1 },
        { time: '20:00', p50: 11.4, p95: 24.8 }
    ]
};

export const mockKafkaMetrics = {
    status: 'HEALTHY',
    brokers_connected: 3,
    active_topics: ['transactions_raw', 'fraud_alerts', 'login_events_raw'],
    throughput_msg_sec: 1420,
    consumer_lag: 12,
    total_messages_today: 4892019,
    alerts_emitted_today: 8420,
    redis_cache_hit_rate: '98.6%'
};
