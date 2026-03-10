import { Platform } from "react-native";

// ─── Single source of truth for backend connection ───
// IMPORTANT: If testing on a physical phone, replace 'localhost' with your computer's IP
const LOCAL_IP = "127.0.0.1"; // <--- Explicit IPv4 to prevent Node v22 localhost DNS resolution drops
const LOCAL_HOST = `${LOCAL_IP}:5001`;
const RENDER_HOST = "kisaan-stripe-backend.onrender.com";

// ─── Smart URL Selector ───
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
const HOST = IS_PRODUCTION ? RENDER_HOST : LOCAL_HOST;

export const API_BASE = HOST.includes("render.com") ? `https://${HOST}/api` : `http://${HOST}/api`;
export const UPLOADS_URL = HOST.includes("render.com") ? `https://${HOST}/uploads/` : `http://${HOST}/uploads/`;
export const SOCKET_URL = HOST.includes("render.com") ? `https://${HOST}` : `http://${HOST}`;

export const ENDPOINTS = {
    AUTH: {
        SEND_OTP: `${API_BASE}/auth/send-otp`,
        VERIFY_OTP: `${API_BASE}/auth/verify-otp`,
        SIGNUP: `${API_BASE}/auth/signup-complete`,
        LOGIN: `${API_BASE}/auth/login`,
    },
    USER: {
        PROFILE: `${API_BASE}/users/profile`,
        LOCATION: `${API_BASE}/users/location`,
        VERIFY: `${API_BASE}/users/verify`,
        VERIFY_PIN: `${API_BASE}/users/verify-pin`,
        CHANGE_PASSWORD: `${API_BASE}/users/change-password`,
    },
    INVENTORY: {
        MINE: `${API_BASE}/inventory/mine`,
        CREATE: `${API_BASE}/inventory`,
        ITEM: (id: string) => `${API_BASE}/inventory/${id}`,
    },
    MARKET: {
        MANDI: `${API_BASE}/mandi`,
        NEARBY: `${API_BASE}/mandi/nearby`,
        WATCHLIST: `${API_BASE}/watchlist`,
        LOCATIONS: `${API_BASE}/locations`,
    },
    CHAT: {
        INIT: `${API_BASE}/chat/init`,
        MY_CHATS: `${API_BASE}/chat/my-chats`,
        MESSAGES: (id: string) => `${API_BASE}/chat/${id}`,
        UPLOAD: `${API_BASE}/chat/upload`,
    },
    DEALS: {
        CREATE: `${API_BASE}/deals`,
        ACTION: (id: string, action: string) => `${API_BASE}/deals/${id}/${action}`,
        GET: (id: string) => `${API_BASE}/deals/${id}`,
    },
    ADMIN: {
        STATS: `${API_BASE}/admin/stats`,
        ACTIVITIES: `${API_BASE}/admin/activities`,
        ORDERS: `${API_BASE}/admin/orders`,
        ANALYTICS: `${API_BASE}/admin/analytics`,
    },
    INVOICE: (dealId: string) => `${API_BASE}/invoices/${dealId}/download`,
    AUCTIONS: {
        CREATE: `${API_BASE}/auctions`,
        CLOSE: (id: string) => `${API_BASE}/auctions/${id}/close`,
        GET_ALL: `${API_BASE}/auctions`,
        MY_BIDS: `${API_BASE}/auctions/bids/mine`,
        DELETE: (id: string) => `${API_BASE}/auctions/${id}`,
        EXTEND: (id: string) => `${API_BASE}/auctions/${id}/extend`,
    },
    NOTIFICATIONS: {
        BASE: `${API_BASE}/notifications`,
        GET_ALL: `${API_BASE}/notifications`,
        UNREAD_COUNT: `${API_BASE}/notifications/unread-count`,
        READ_ALL: `${API_BASE}/notifications/read-all`,
    },
    ANALYTICS: {
        FORECAST: `${API_BASE}/analytics/price-forecast`,
    },
    PAYMENTS: {
        INTENT: (dealId: string) => `${API_BASE}/payments/intent/${dealId}`,
        CONFIRM: (dealId: string) => `${API_BASE}/payments/confirm/${dealId}`,
        RELEASE: (dealId: string) => `${API_BASE}/payments/release/${dealId}`,
    },
};
