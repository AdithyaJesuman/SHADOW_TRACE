export const api = {
    getTransactions: async (limit = 20) => {
        try {
            const response = await fetch(`/transactions?limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Connection Error: Could not fetch transactions.", error);
            return [];
        }
    },
    getFlaggedTransactions: async (limit = 50) => {
        try {
            const response = await fetch(`/transactions?is_flagged=true&limit=${limit}`);
            if (!response.ok) throw new Error("Failed to fetch flagged transactions");
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },
    getTransactionDetail: async (txId) => {
        try {
            const response = await fetch(`/transactions/${txId}`);
            if (!response.ok) throw new Error("Transaction not found");
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    }
};
