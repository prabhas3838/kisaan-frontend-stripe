import { ENDPOINTS } from "./api";
import { apiFetch } from "./http";

export type Crop = "Tomato" | "Onion" | "Potato" | "Wheat" | "Rice" | "Maize";

export type MandiPriceDoc = {
  _id: string;
  crop: Crop;
  mandi?: string;
  locationName?: string;
  pricePerQuintal: number;
  updatedAt?: string;
  date?: string;
  isBestPrice?: boolean;
  quality?: string;
};

export type NearbyMandi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distKm: number;
};

export type MandiApiResponse = {
  success: boolean;
  data: MandiPriceDoc[];
  count?: number;
  source: "live" | "cache";
  lastUpdated?: string;
  requestId?: string;
};

/**
 * Robust retry helper with exponential backoff
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

function toQuery(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");
}

function normalizeArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res as T[];
  if (Array.isArray(res?.data)) return res.data as T[];
  return [];
}

/**
 * FETCH MANDI PRICES WITH RETRY
 */
export async function fetchMandiPrices(params: {
  crop?: Crop | string;
  mandi?: string;
  sort?: "latest" | "price_desc" | "price_asc";
  limit?: number;
  location?: string;
  bypassCache?: boolean;
}): Promise<MandiApiResponse> {
  const qs = toQuery(params);
  const url = `${ENDPOINTS.MARKET.MANDI}${qs ? `?${qs}` : ""}`;

  return withRetry(async () => {
    const res = await apiFetch<any>(url, {
      method: "GET",
      headers: { 'x-request-id': `mob-${Math.random().toString(36).substring(7)}` }
    });

    return {
      success: res.success ?? true,
      data: normalizeArray<MandiPriceDoc>(res),
      count: res.count,
      source: res.source || "live",
      lastUpdated: res.lastUpdated,
      requestId: res.requestId
    };
  });
}

/**
 * FETCH NEARBY MANDIS
 */
export async function fetchNearbyMandis(params: {
  lat: number;
  lng: number;
  distKm: number;
  limit: number;
}): Promise<NearbyMandi[]> {
  const qs = toQuery(params);
  const url = `${ENDPOINTS.MARKET.NEARBY}${qs ? `?${qs}` : ""}`;

  return withRetry(async () => {
    try {
      const res = await apiFetch<any>(url, { method: "GET" });
      const rawRows = normalizeArray<any>(res);

      return rawRows.map((r: any, idx: number) => {
        const coords = r?.coordinates ?? r?.locationCoordinates ?? r?.coords ?? [];
        const lng = Array.isArray(coords) ? Number(coords[0]) : Number(r?.lng);
        const lat = Array.isArray(coords) ? Number(coords[1]) : Number(r?.lat);
        const meters = Number(r?.distance ?? r?.distMeters ?? r?.meters ?? 0);
        return {
          id: String(r?._id ?? r?.id ?? idx),
          name: String(r?.locationName ?? r?.name ?? r?.mandi ?? "Unknown"),
          lat,
          lng,
          distKm: meters ? meters / 1000 : Number(r?.distKm ?? 0),
        };
      });
    } catch (e) {
      // POST Fallback
      const res2 = await apiFetch<any>(ENDPOINTS.MARKET.NEARBY, {
        method: "POST",
        body: JSON.stringify(params),
      });
      const rawRows2 = normalizeArray<any>(res2);
      return rawRows2.map((r: any, idx: number) => ({
        id: String(r?._id ?? r?.id ?? idx),
        name: String(r?.locationName ?? r?.name ?? r?.mandi ?? "Unknown"),
        lat: Number(r?.lat || 0),
        lng: Number(r?.lng || 0),
        distKm: Number(r?.distKm || 0),
      }));
    }
  });
}

