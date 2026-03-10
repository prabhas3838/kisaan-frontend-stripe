import { API_BASE } from "./api";
import { apiFetch } from "./http";
import { getToken } from "./token";

export type WatchlistItem = {
    _id: string;
    crop: string;
    mandi: string;
    createdAt?: string;
};

async function authHeaders() {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
}

export async function getWatchlist() {
    const res = await apiFetch<{ success: boolean; data: WatchlistItem[] }>(
        `${API_BASE}/watchlist`,
        {
            method: "GET",
            headers: await authHeaders(),
        }
    );
    return res.data || [];
}

export async function addToWatchlist(crop: string, mandi: string) {
    return apiFetch<any>(`${API_BASE}/watchlist`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ crop, mandi }),
    });
}

export async function removeFromWatchlist(id: string) {
    return apiFetch<any>(`${API_BASE}/watchlist/${id}`, {
        method: "DELETE",
        headers: await authHeaders(),
    });
}
