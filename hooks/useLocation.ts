import * as Location from "expo-location";
import { useCallback, useState } from "react";

type PermissionState = "granted" | "denied" | "unknown";

export function useLocation() {
  const [coords, setCoords] = useState({
    lat: 17.4375,
    lng: 78.4483,
  });
  const [permission, setPermission] = useState<PermissionState>("unknown");

  const requestAndGetLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setPermission("denied");
      return;
    }

    setPermission("granted");

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setCoords({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    });
  }, []);

  return {
    coords,
    permission,
    requestAndGetLocation,
  };
}
