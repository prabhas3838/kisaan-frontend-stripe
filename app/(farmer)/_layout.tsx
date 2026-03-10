import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import NavFarmer from "../../components/navigation/Nav";

export default function FarmerLayout() {
    return (
        <View style={styles.container}>
            {/* Pages render here */}
            <View style={styles.content}>
                <Stack screenOptions={{ headerShown: false }} />
            </View>

            {/* Persistent Bottom Nav */}
            <NavFarmer />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingBottom: 70, // Space for bottom nav
    },
});
