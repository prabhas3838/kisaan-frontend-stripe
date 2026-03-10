import { io, Socket } from "socket.io-client";
import { SOCKET_URL, ENDPOINTS } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./http";

class NotificationService {
    private socket: Socket | null = null;
    private chatSocket: Socket | null = null;
    private listeners: ((unreadCount: number) => void)[] = [];
    private unreadCount: number = 0;

    async init() {
        if (this.socket?.connected || this.chatSocket?.connected) return;

        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");

        if (!token || !userId) {
            console.warn("🔔 NotificationService: Missing token or userId, skipping init");
            return;
        }

        console.log("🔔 NotificationService: Initializing for user", userId);

        // Initialize socket
        this.socket = io(SOCKET_URL, {
            transports: ["websocket"],
            auth: { token }
        });

        this.socket.on("connect", () => {
            console.log("🔔 NotificationService: Connected! ID:", this.socket?.id);
            this.socket?.emit("joinNotifications", { userId });
            console.log("🔔 NotificationService: Emitted joinNotifications for", userId);
        });

        this.socket.on("connect_error", (err) => {
            console.error("🔔 NotificationService: Connection Error:", err.message);
        });

        this.socket.on("new_notification", (notification) => {
            console.log("New notification received:", notification);
            this.unreadCount += 1;
            this.notifyListeners();
        });

        // Initialize Chat Socket for global message badges
        this.chatSocket = io(`${SOCKET_URL}/chat`, {
            transports: ["websocket"],
            auth: { token }
        });

        this.chatSocket.on("connect", () => {
            console.log("🔔 NotificationService: Chat Socket Connected! ID:", this.chatSocket?.id);
            // We join a personal room based on userId to receive all new messages meant for us
            this.chatSocket?.emit("joinUserRoom", userId);
        });

        this.chatSocket.on("newMessage", (data) => {
            // Only increment if we aren't the sender
            if (data.message && data.message.sender !== userId) {
                console.log("🔔 NotificationService: New Chat Message Received!");
                this.unreadCount += 1;
                this.notifyListeners();
            }
        });

        // Initial fetch
        this.fetchUnreadCount();
    }

    async fetchUnreadCount() {
        try {
            const res = await apiFetch<{ success: boolean; count: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
            if (res.success) {
                console.log("🔔 NotificationService: Unread count updated:", res.count);
                this.unreadCount = res.count;
                this.notifyListeners();
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }

    incrementUnread() {
        this.unreadCount += 1;
        this.notifyListeners();
    }

    subscribe(callback: (unreadCount: number) => void) {
        this.listeners.push(callback);
        callback(this.unreadCount);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(callback => callback(this.unreadCount));
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        if (this.chatSocket) {
            this.chatSocket.disconnect();
            this.chatSocket = null;
        }
    }

    getUnreadCount() {
        return this.unreadCount;
    }
}

export const notificationService = new NotificationService();
