import { Stack } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import NavAuto from "../components/navigation/NavAuto";

import { FilterBar } from "../components/market/FilterBar";
import { MarketTable } from "../components/market/MarketTable";
import { SummaryCards } from "../components/market/SummaryCards";
import { fetchMandiPrices, MandiPriceDoc } from "../services/mandiService";

export default function MandiPricesScreen() {
  // Data State
  const [prices, setPrices] = useState<MandiPriceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Filter State
  const [market, setMarket] = useState("All");
  const [sort, setSort] = useState<"latest" | "price_desc" | "price_asc">("latest");

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const response = await fetchMandiPrices({
        limit: 200,
        sort: "latest",
        bypassCache: isRefresh
      });

      if (response.success) {
        setPrices(response.data);
        setLastUpdated(response.lastUpdated || new Date().toISOString());
      } else {
        setError("Unable to sync with market server.");
      }
    } catch (e: any) {
      setError("Market connectivity issues. Retrying...");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // 1. Memoized Filtering & Sorting Logic
  const filteredData = useMemo(() => {
    let data = [...prices];

    // Market filter
    if (market !== "All") {
      data = data.filter(p => (p.locationName || p.mandi) === market);
    }

    // Client-side Sort (Ensure UI stays snappy if API sort takes time or for local filter changes)
    if (sort === "price_desc") {
      data.sort((a, b) => Number(b.pricePerQuintal) - Number(a.pricePerQuintal));
    } else if (sort === "price_asc") {
      data.sort((a, b) => Number(a.pricePerQuintal) - Number(b.pricePerQuintal));
    } else {
      data.sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
    }

    return data;
  }, [prices, market, sort]);

  // 2. Memoized Summary Statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { total: 0, high: 0, low: 0, avg: 0 };

    const validPrices = filteredData.map(p => Number(p.pricePerQuintal)).filter(n => !isNaN(n));
    if (validPrices.length === 0) return { total: 0, high: 0, low: 0, avg: 0 };

    const sum = validPrices.reduce((a, b) => a + b, 0);
    return {
      total: new Set(filteredData.map(p => p.crop)).size,
      high: Math.max(...validPrices),
      low: Math.min(...validPrices),
      avg: sum / validPrices.length
    };
  }, [filteredData]);

  // 3. Extract Unique Markets for Filter
  const availableMarkets = useMemo(() => {
    const set = new Set(prices.map(p => p.locationName || p.mandi || "Unknown"));
    return Array.from(set).sort();
  }, [prices]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: "Market Explorer", headerShown: false }} />
      <NavAuto />


      <View style={styles.header}>
        <Text style={styles.title}>Mandi Prices</Text>
        {lastUpdated && (
          <Text style={styles.subtitle}>Last synced: {new Date(lastUpdated).toLocaleTimeString()}</Text>
        )}
      </View>

      <View style={styles.content}>
        <SummaryCards
          totalCrops={stats.total}
          highestPrice={stats.high}
          lowestPrice={stats.low}
          avgPrice={stats.avg}
        />

        <FilterBar
          selectedMarket={market}
          onMarketChange={setMarket}
          markets={availableMarkets}
          sortOrder={sort}
          onSortChange={setSort}
        />

        <MarketTable
          data={filteredData}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          error={error}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 16 },
});


