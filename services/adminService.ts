import { apiFetch } from "./http";
import { ENDPOINTS, API_BASE } from "./api";

export const adminService = {
    getStats: async () => {
        return apiFetch<any>(ENDPOINTS.ADMIN.STATS);
    },

    getRecentActivities: async () => {
        return apiFetch<any>(ENDPOINTS.ADMIN.ACTIVITIES);
    },

    getUsers: async (role?: string) => {
        return apiFetch<any>(`${ENDPOINTS.USER.PROFILE.replace("/profile", "")}${role ? `?role=${role}` : ""}`);
    },

    updateUserStatus: async (userId: string, status: string, comment?: string) => {
        return apiFetch<any>(`${ENDPOINTS.USER.PROFILE.replace("/profile", "")}/${userId}/verify-status`, {
            method: "PUT",
            body: JSON.stringify({ status, comment })
        });
    },

    getListings: async () => {
        // Since there is no 'all inventory' endpoint, we monitor active auctions as 'products'
        return apiFetch<any>(`${API_BASE}/auctions`);
    },

    getAllOrders: async () => {
        return apiFetch<any>(ENDPOINTS.ADMIN.ORDERS);
    },

    approveListing: async (listingId: string) => {
        return apiFetch<any>(`${API_BASE}/inventory/${listingId}/approve`, {
            method: "POST"
        });
    },
    getAnalytics: async (timeframe: string = "6m") => {
        return apiFetch<any>(`${ENDPOINTS.ADMIN.ANALYTICS}?timeframe=${timeframe}`);
    },
    getMonthlyDetail: async () => {
        return apiFetch<any>(`${ENDPOINTS.ADMIN.STATS.replace('/stats', '/monthly-detail')}`);
    }
};
