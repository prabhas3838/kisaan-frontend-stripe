import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavFarmer from "./NavFarmer";
import NavBuyer from "./NavBuyer";

/**
 * Auto-detects user role from AsyncStorage and renders the
 * appropriate navbar (green for farmer, blue for buyer).
 * Use this on shared pages accessible by both roles.
 */
export default function NavAuto() {
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        AsyncStorage.getItem("role").then((r) => setRole(r));
    }, []);

    if (role === "buyer") return <NavBuyer />;
    return <NavFarmer />;
}
