import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Lucide from "lucide-react-native";
import WeatherCard from "../components/weather/WeatherCard";
import ForecastItem from "../components/weather/ForecastItem";
import Nav from "../components/navigation/Nav";

// Default coordinates (Warangal, Telangana - agriculture hub)
const DEFAULT_LAT = 17.9689;
const DEFAULT_LON = 79.5941;

export default function WeatherScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weatherData, setWeatherData] = useState<any>(null);

    const fetchWeather = async (lat = DEFAULT_LAT, lon = DEFAULT_LON) => {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation,relativehumidity_2m,weathercode&timezone=auto`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.current_weather) {
                setWeatherData(data);
                setError(null);
            } else {
                setError("Failed to fetch weather data.");
            }
        } catch (err) {
            console.error("Weather Fetch Error:", err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWeather();
    };

    const getWeatherCondition = (code: number) => {
        // simplified WMO Weather interpretation codes
        if (code === 0) return { text: "Clear Sky", icon: "Sun", color: "#F59E0B" };
        if (code <= 3) return { text: "Partly Cloudy", icon: "Cloud", color: "#64748B" };
        if (code >= 45 && code <= 48) return { text: "Foggy", icon: "CloudFog", color: "#94A3B8" };
        if (code >= 51 && code <= 67) return { text: "Rainy", icon: "CloudRain", color: "#3B82F6" };
        if (code >= 71 && code <= 77) return { text: "Snowy", icon: "Snowflake", color: "#10B981" };
        if (code >= 80 && code <= 82) return { text: "Showers", icon: "CloudDrizzle", color: "#6366F1" };
        if (code >= 95) return { text: "Thunderstorm", icon: "CloudLightning", color: "#EF4444" };
        return { text: "Clear Sky", icon: "Sun", color: "#F59E0B" };
    };

    const getAgriTip = () => {
        if (!weatherData) return "Checking conditions for your crops...";

        const current = weatherData.current_weather;
        const hourly = weatherData.hourly;
        const currentTimeIndex = new Date().getHours();

        const temp = current.temperature;
        const rain = hourly.precipitation[currentTimeIndex] || 0;
        const humidity = hourly.relativehumidity_2m[currentTimeIndex] || 0;
        const wind = current.windspeed;

        if (rain > 0.5) return "Rain detected. No need to irrigate today.";
        if (temp > 35) return "High heat! Ensure your crops have extra water.";
        if (humidity < 35) return "Dry air detected. Good time for irrigation.";
        if (wind > 25) return "High winds. Be careful with spray-based pesticides.";
        if (temp < 12 && temp > 0) return "Cool weather. Growth may be slower today.";

        return "Perfect conditions for irrigation today.";
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Fetching farm weather...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Lucide.AlertCircle size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const current = weatherData.current_weather;
    const condition = getWeatherCondition(current.weathercode);
    const hourly = weatherData.hourly;
    const currentTimeIndex = new Date().getHours();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <Nav />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
                }
            >
                {/* HEADER SECTION */}
                <View style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.locationName}>Warangal, TS</Text>
                            <Text style={styles.dateText}>
                                {new Date().toLocaleDateString("en-IN", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                })}
                            </Text>
                        </View>
                        <View style={styles.conditionBadge}>
                            <Text style={styles.conditionBadgeText}>{condition.text}</Text>
                        </View>
                    </View>

                    <View style={styles.tempContainer}>
                        <Text style={styles.mainTemp}>{Math.round(current.temperature)}°</Text>
                        <View style={styles.tempRight}>
                            <Lucide.CloudSun size={40} color="#FFFFFF" />
                            <Text style={styles.feelsLike}>Feels like {Math.round(current.temperature - 2)}°</Text>
                        </View>
                    </View>

                    <View style={styles.agriTipContainer}>
                        <Lucide.Sprout size={16} color="#ECFDF5" />
                        <Text style={styles.agriTipText}>
                            {getAgriTip()}
                        </Text>
                    </View>
                </View>

                {/* WEATHER STATS GRID */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionSubtitle}>Current conditions</Text>
                </View>

                <View style={styles.statsGrid}>
                    <WeatherCard
                        label="Temperature"
                        value={Math.round(current.temperature).toString()}
                        unit="°C"
                        icon="Thermometer"
                        color="#EF4444"
                    />
                    <WeatherCard
                        label="Wind Speed"
                        value={current.windspeed.toString()}
                        unit=" km/h"
                        icon="Wind"
                        color="#3B82F6"
                    />
                    <WeatherCard
                        label="Humidity"
                        value={hourly.relativehumidity_2m[currentTimeIndex].toString()}
                        unit="%"
                        icon="Droplets"
                        color="#10B981"
                    />
                    <WeatherCard
                        label="Precipitation"
                        value={hourly.precipitation[currentTimeIndex].toString()}
                        unit=" mm"
                        icon="Umbrella"
                        color="#6366F1"
                    />
                </View>

                {/* FORECAST SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Next 12 Hours</Text>
                    <Text style={styles.sectionSubtitle}>Hourly forecast</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.forecastList}
                    contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
                >
                    {hourly.time.slice(currentTimeIndex, currentTimeIndex + 12).map((time: string, index: number) => {
                        const date = new Date(time);
                        const hour = date.getHours();
                        const ampm = hour >= 12 ? "PM" : "AM";
                        const displayHour = hour % 12 || 12;

                        // Map weather codes to simple strings for ForecastItem
                        const code = hourly.weathercode[currentTimeIndex + index];
                        let cond: "sunny" | "cloudy" | "rainy" | "stormy" = "sunny";
                        if (code <= 3) cond = index % 3 === 0 ? "sunny" : "cloudy"; // Mocking dynamic icons based on codes
                        else if (code >= 51) cond = "rainy";

                        return (
                            <ForecastItem
                                key={time}
                                time={`${displayHour}${ampm}`}
                                temp={hourly.temperature_2m[currentTimeIndex + index]}
                                condition={cond}
                            />
                        );
                    })}
                </ScrollView>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    scrollContent: {
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#64748B",
        fontWeight: "600",
    },
    errorText: {
        marginTop: 12,
        fontSize: 10,
        color: "#EF4444",
        textAlign: "center",
        marginBottom: 20,
    },
    retryBtn: {
        backgroundColor: "#10B981",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: "#FFF",
        fontWeight: "800",
    },
    headerCard: {
        backgroundColor: "#10B981", // Agriculture Green
        margin: 20,
        borderRadius: 28,
        padding: 24,
        // Premium Shadow
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    locationName: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    dateText: {
        fontSize: 14,
        color: "#ECFDF5",
        marginTop: 2,
        fontWeight: "600",
    },
    conditionBadge: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    conditionBadgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
    },
    tempContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
    },
    mainTemp: {
        fontSize: 72,
        fontWeight: "900",
        color: "#FFFFFF",
        lineHeight: 80,
    },
    tempRight: {
        marginLeft: 20,
    },
    feelsLike: {
        fontSize: 14,
        color: "#ECFDF5",
        marginTop: 4,
        fontWeight: "600",
    },
    agriTipContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        padding: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    agriTipText: {
        color: "#ECFDF5",
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 8,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
    },
    sectionSubtitle: {
        fontSize: 13,
        color: "#94A3B8",
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 20,
    },
    forecastList: {
        paddingVertical: 4,
    },
    infoFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        marginTop: 32,
        opacity: 0.6,
    },
    footerText: {
        fontSize: 11,
        color: "#64748B",
        textAlign: "center",
        marginLeft: 6,
        lineHeight: 16,
    },
});
