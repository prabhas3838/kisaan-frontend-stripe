import AsyncStorage from "@react-native-async-storage/async-storage";

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = await AsyncStorage.getItem("token");
    const headers: any = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`🌐 [OUT] ${options.method || 'GET'} ${url}`);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    const text = await res.text();
    console.log(`🌐 [IN] ${res.status} ${url} | RAW: ${text.slice(0, 100)}...`);

    if (!res.ok) {
      // If 401, maybe token expired?
      if (res.status === 401) {
        console.warn("⚠️ 401 Unauthorized - Token may be invalid.");
      }
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Non-JSON response (Status ${res.status}): ${text.slice(0, 100)}`);
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`Timeout after ${timeoutMs}ms. URL: ${url}`);
    }
    console.error(`❌ [API_ERROR] ${url} | ${e?.message}`);
    throw new Error(`${e?.message || "Network request failed"} | URL: ${url}`);
  } finally {
    clearTimeout(id);
  }
}
