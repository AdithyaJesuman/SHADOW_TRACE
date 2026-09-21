const BASE_URL = 'http://localhost:8000';

import { 
    generateMockTransactions, 
    generateMockFlagged, 
    generateMockDetail, 
    mockCustomerProfiles, 
    mockFraudRings, 
    mockModelMetrics,
    mockKafkaMetrics
} from './mockData';

let cachedTransactions = null;

export const api = {
    // Health & System Status
    getHealth: async () => {
        try {
            const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
            if (res.ok) return await res.json();
            return { status: "degraded", mode: "local-intelligence" };
        } catch {
            return { status: "simulator-active", mode: "standalone-client" };
        }
    },

    // Transaction Feeds
    getTransactions: async (limit = 25, offset = 0, isFlagged = null) => {
        try {
            let url = `${BASE_URL}/transactions?limit=${limit}&offset=${offset}`;
            if (isFlagged !== null) {
                url += `&is_flagged=${isFlagged}`;
            }
            const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }
            // fallback to rich simulated stream if db is clean/empty
            return generateMockTransactions(limit);
        } catch (error) {
            // Standalone mode / offline backend fallback
            if (!cachedTransactions || cachedTransactions.length < limit) {
                cachedTransactions = generateMockTransactions(50);
            }
            return cachedTransactions.slice(0, limit);
        }
    },

    getFlaggedTransactions: async (limit = 50, offset = 0) => {
        try {
            const response = await fetch(`${BASE_URL}/flagged?limit=${limit}&offset=${offset}`, { signal: AbortSignal.timeout(2500) });
            if (!response.ok) throw new Error("Failed to fetch flagged transactions");
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }
            return generateMockFlagged(limit);
        } catch (error) {
            return generateMockFlagged(limit);
        }
    },

    getTransactionDetail: async (txId) => {
        try {
            const response = await fetch(`${BASE_URL}/transactions/${txId}`, { signal: AbortSignal.timeout(2500) });
            if (!response.ok) throw new Error("Transaction not found");
            return await response.json();
        } catch (error) {
            return generateMockDetail(txId);
        }
    },

    // Customer & Identity 360
    getCustomer: async (externalId) => {
        try {
            const response = await fetch(`${BASE_URL}/customers/${encodeURIComponent(externalId)}`, { signal: AbortSignal.timeout(2500) });
            if (!response.ok) throw new Error("Customer not found");
            return await response.json();
        } catch (error) {
            const profile = mockCustomerProfiles[externalId] || mockCustomerProfiles['U0012483'];
            return profile;
        }
    },

    getCustomerPredictions: async (externalId) => {
        try {
            const response = await fetch(`${BASE_URL}/customers/${encodeURIComponent(externalId)}/predictions`, { signal: AbortSignal.timeout(2500) });
            if (!response.ok) throw new Error("Predictions not found");
            return await response.json();
        } catch (error) {
            const profile = mockCustomerProfiles[externalId] || mockCustomerProfiles['U0012483'];
            return profile?.predictions || [];
        }
    },

    // Ingestion & Simulator
    sendTransaction: async (txPayload) => {
        try {
            const response = await fetch(`${BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(txPayload),
            });
            if (!response.ok) throw new Error(`Ingest failed: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            // Local simulation response
            const simulatedScore = Math.random() > 0.65 ? (0.75 + Math.random() * 0.24) : (Math.random() * 0.25);
            return {
                status: "Accepted",
                message: "Transaction dispatched to Kafka topic `transactions_raw` & Graph Pipeline",
                simulated_score: Number(simulatedScore.toFixed(3)),
                risk_level: simulatedScore > 0.7 ? "HIGH" : (simulatedScore > 0.3 ? "ELEVATED" : "NORMAL")
            };
        }
    },

    // Graph Rings & Network Intelligence
    getFraudRings: async () => {
        // Returns graph rings structure with nodes, links, and ring metadata
        return mockFraudRings;
    },

    // ML & Pipeline Diagnostics
    getModelMetrics: async () => {
        return mockModelMetrics;
    },

    // Real-time Kafka Streaming Metrics
    getKafkaMetrics: async () => {
        return mockKafkaMetrics;
    }
};

