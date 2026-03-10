import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    Linking,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatService } from "../../services/chatService";
import { dealService } from "../../services/dealService";
import { getProfile } from "../../services/userServices";
import { paymentService } from "../../services/paymentService";
import { ENDPOINTS, SOCKET_URL, UPLOADS_URL } from "../../services/api";

// ─── Types ───
type Message = {
    _id?: string;
    sender: string;
    content: string;
    type: "text" | "image";
    read: boolean;
    timestamp: string;
    _optimistic?: boolean;
};

type Participant = {
    _id: string;
    name: string;
    phone: string;
    role: string;
};

type DealData = {
    _id: string;
    crop: string;
    quantityKg: number;
    originalPrice: number;
    currentOffer: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    lastOfferBy: string;
    expiresAt: string;
    buyer: Participant;
    seller: Participant;
    paymentStatus?: "unpaid" | "held_in_escrow" | "released" | "refunded";
    stripePaymentIntentId?: string;
    deliveryStatus?: "pending" | "delivered";
    history: Array<{ price: number; offeredBy: string; timestamp: string }>;
    createdAt: string;
};

export default function ChatScreen() {
    const { id: chatId, dealId: initialDealId } = useLocalSearchParams<{
        id: string;
        dealId?: string;
    }>();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const socketRef = useRef<Socket | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [myId, setMyId] = useState<string>("");
    const [chatParticipants, setChatParticipants] = useState<Participant[]>([]);
    const [dealData, setDealData] = useState<DealData | null>(null);
    const [sending, setSending] = useState(false);

    // Counter-offer modal
    const [counterModalVisible, setCounterModalVisible] = useState(false);
    const [counterPrice, setCounterPrice] = useState("");

    // Image preview modal
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Expiry timer
    const [expiryText, setExpiryText] = useState("");

    // ─── Load Data ───
    useEffect(() => {
        loadData();
        setupSocket();
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    // ─── Expiry Timer ───
    useEffect(() => {
        if (!dealData || dealData.status !== "PENDING" || !dealData.expiresAt) return;

        const tick = () => {
            const now = Date.now();
            const exp = new Date(dealData.expiresAt).getTime();
            const diff = exp - now;

            if (diff <= 0) {
                setExpiryText("Expired");
                setDealData((prev) => (prev ? { ...prev, status: "EXPIRED" } : prev));
                return;
            }

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setExpiryText(`${h}h ${m}m ${s}s`);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [dealData?.expiresAt, dealData?.status]);

    const loadData = async () => {
        try {
            // Get my ID — try AsyncStorage first, fallback to API
            const profileRaw = await AsyncStorage.getItem("profile");
            let meId = "";
            if (profileRaw) {
                const p = JSON.parse(profileRaw);
                meId = p._id || p.id || "";
                setMyId(meId);
            } else {
                // Fetch from API and cache
                try {
                    const data = await getProfile();
                    if (data?.success && data.user) {
                        meId = data.user._id || data.user.id;
                        setMyId(meId);
                        await AsyncStorage.setItem("profile", JSON.stringify(data.user));
                    }
                } catch (e) {
                    console.log("Profile fetch fallback failed:", e);
                }
            }

            if (!chatId) return;

            // Load chat messages
            const res = await chatService.getChatMessages(chatId!);
            if (res.success) {
                setChatParticipants(res.chat.participants || []);
                setMessages(res.chat.messages || []);
            }

            // Load deal if linked
            const dId = res.chat?.dealId || initialDealId;
            if (dId) {
                try {
                    const dealRes = await dealService.getDeal(dId);
                    if (dealRes.success) setDealData(dealRes.deal);
                } catch (e) {
                    console.log("Deal load skipped:", e);
                }
            }
        } catch (err) {
            console.log("Chat load error:", err);
            Alert.alert("Error", "Could not load chat. Please go back and try again.");
        } finally {
            setLoading(false);
        }
    };

    const setupSocket = async () => {
        try {
            const socket = io(`${SOCKET_URL}/chat`, {
                transports: ["websocket"],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
            });

            socket.on("connect", () => {
                console.log("✅ Socket connected:", socket.id);
                socket.emit("joinChat", chatId);
                if (initialDealId) {
                    socket.emit("joinDeal", `deal_${initialDealId}`);
                }
            });

            socket.on("dealUpdated", (updatedDeal) => {
                setDealData(updatedDeal);
            });

            socket.on("newMessage", (data: { chatId: string; message: Message }) => {
                if (data.chatId === chatId) {
                    setMessages((prev) => {
                        // Remove optimistic duplicate
                        const filtered = prev.filter((m) => !m._optimistic);
                        return [...filtered, data.message];
                    });
                    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
                }
            });

            socket.on("messagesRead", (data: { chatId: string; readerId: string }) => {
                if (data.chatId === chatId) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.sender !== data.readerId ? { ...m, read: true } : m
                        )
                    );
                }
            });

            socket.on("connect_error", (err) => {
                console.log("⚠️ Socket error:", err.message);
            });

            socketRef.current = socket;
        } catch (err) {
            console.log("Socket setup error:", err);
        }
    };

    // ─── Send Text ───
    const sendMessage = useCallback(() => {
        if (!inputText.trim() || !socketRef.current || sending) return;

        const content = inputText.trim();
        setInputText("");

        // Optimistic add
        const optimistic: Message = {
            _id: `opt_${Date.now()}`,
            sender: myId,
            content,
            type: "text",
            read: false,
            timestamp: new Date().toISOString(),
            _optimistic: true,
        };
        setMessages((prev) => [...prev, optimistic]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        socketRef.current.emit("sendMessage", {
            chatId,
            senderId: myId,
            content,
            type: "text",
        });
    }, [inputText, myId, chatId, sending]);

    // ─── Pick + Upload Image ───
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];

                // 5MB check
                if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                    Alert.alert("Too Large", "Image must be under 5MB.");
                    return;
                }

                await uploadImage(asset.uri);
            }
        } catch (err) {
            Alert.alert("Error", "Could not open image picker.");
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            setSending(true);
            const formData = new FormData();
            const filename = uri.split("/").pop() || "photo.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : "image/jpeg";

            formData.append("image", { uri, name: filename, type } as any);

            const res = await chatService.uploadImage(formData);
            if (res.success && socketRef.current) {
                socketRef.current.emit("sendMessage", {
                    chatId,
                    senderId: myId,
                    content: res.imageUrl,
                    type: "image",
                });
            }
        } catch (err) {
            Alert.alert("Upload Failed", "Could not send image. Please try again.");
        } finally {
            setSending(false);
        }
    };

    // ─── Deal Actions ───
    const handleAcceptDeal = async () => {
        if (!dealData) return;

        const executeAccept = async () => {
            try {
                const res = await dealService.acceptOffer(dealData._id);
                if (res.success) {
                    setDealData(res.deal);
                    if (Platform.OS === 'web') {
                        window.alert('✅ Deal Accepted! You can now download the invoice.');
                    } else {
                        Alert.alert("✅ Deal Accepted!", "You can now download the invoice.");
                    }
                }
            } catch (err: any) {
                const msg = err.response?.data?.message || "Could not accept deal.";
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Error", msg);
            }
        };

        if (Platform.OS === "web") {
            if (window.confirm(`Accept ₹${dealData.currentOffer}/kg for ${dealData.quantityKg}kg ${dealData.crop}?`)) {
                executeAccept();
            }
        } else {
            Alert.alert(
                "Accept Deal",
                `Accept ₹${dealData.currentOffer}/kg for ${dealData.quantityKg}kg ${dealData.crop}?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Accept", style: "default", onPress: executeAccept },
                ]
            );
        }
    };

    const handleRejectDeal = async () => {
        if (!dealData) return;

        const executeReject = async () => {
            try {
                const res = await dealService.rejectOffer(dealData._id);
                if (res.success) {
                    setDealData(res.deal);
                    if (Platform.OS === 'web') window.alert('Deal Rejected');
                    else Alert.alert("Deal Rejected");
                }
            } catch (err: any) {
                const msg = err.response?.data?.message || "Could not reject deal.";
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Error", msg);
            }
        };

        if (Platform.OS === "web") {
            if (window.confirm("Are you sure you want to reject this deal?")) {
                executeReject();
            }
        } else {
            Alert.alert("Reject Deal", "Are you sure you want to reject this deal?", [
                { text: "Cancel", style: "cancel" },
                { text: "Reject", style: "destructive", onPress: executeReject },
            ]);
        }
    };

    const handleCounterOffer = async () => {
        const price = parseFloat(counterPrice);
        if (!price || price <= 0 || !dealData) {
            Platform.OS === 'web' ? window.alert("Enter a valid price.") : Alert.alert("Invalid", "Enter a valid price.");
            return;
        }
        try {
            const res = await dealService.makeOffer(dealData._id, price);
            if (res.success) {
                setDealData(res.deal);
                setCounterModalVisible(false);
                setCounterPrice("");
                if (Platform.OS === 'web') window.alert(`✅ Counter-offer Sent. New offer: ₹${price}`);
                else Alert.alert("✅ Counter-offer Sent", `New offer: ₹${price}`);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Could not send counter-offer.";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Error", msg);
        }
    };

    const handleReleaseFunds = async () => {
        if (!dealData) return;

        const executeRelease = async () => {
            try {
                const res = await paymentService.releaseFunds(dealData._id);
                if (res.success) {
                    setDealData(res.deal);
                    if (Platform.OS === 'web') window.alert("✅ Funds Captured! The escrow funds have been securely transferred to you.");
                    else Alert.alert("✅ Funds Captured!", "The escrow funds have been securely transferred to you.");
                }
            } catch (err: any) {
                const msg = err.response?.data?.message || "Could not release funds.";
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Error", msg);
            }
        };

        if (Platform.OS === "web") {
            if (window.confirm("This will release the escrow funds to your account permanently. Confirm crop delivery?")) {
                executeRelease();
            }
        } else {
            Alert.alert(
                "Mark Delivered",
                "This will release the escrow funds to your account permanently. Confirm crop delivery?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Confirm", onPress: executeRelease },
                ]
            );
        }
    };

    // ─── Invoice Download ───
    const handleDownloadInvoice = async () => {
        if (!dealData) return;
        try {
            const url = ENDPOINTS.INVOICE(dealData._id);
            const token = await AsyncStorage.getItem("token");
            const fileUri = `${FileSystem.documentDirectory}invoice-${dealData._id.substring(0, 8)}.pdf`;

            const download = await FileSystem.downloadAsync(url, fileUri, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (download.status === 200) {
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                    await Sharing.shareAsync(download.uri, {
                        mimeType: "application/pdf",
                        dialogTitle: "Save Invoice",
                    });
                } else {
                    Alert.alert("Downloaded", `Invoice saved to ${download.uri}`);
                }
            } else {
                Alert.alert("Error", "Failed to download invoice.");
            }
        } catch (err) {
            Alert.alert("Error", "Could not download invoice. Please try again.");
        }
    };

    // ─── Mark as Read ───
    const markAsRead = useCallback(() => {
        if (socketRef.current && myId && chatId) {
            socketRef.current.emit("markRead", { chatId, userId: myId });
        }
    }, [myId, chatId]);

    useEffect(() => {
        if (!loading && myId) markAsRead();
    }, [loading, myId, markAsRead]);

    // ─── Get Other Participant ───
    const otherUser = chatParticipants.find((p) => p._id !== myId) || chatParticipants[0];

    // ─── Render Message Bubble ───
    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender === myId;
        const isImage = item.type === "image";
        const imageUri = isImage
            ? item.content.startsWith("http")
                ? item.content
                : `${UPLOADS_URL}${item.content}`
            : null;

        return (
            <View style={[styles.msgWrapper, isMe ? styles.myMsg : styles.theirMsg]}>
                <View
                    style={[
                        styles.msgCloud,
                        isMe ? styles.myCloud : styles.theirCloud,
                        item._optimistic && styles.optimisticCloud,
                    ]}
                >
                    {isImage && imageUri ? (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setPreviewImage(imageUri)}
                        >
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.msgImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.msgText, isMe && styles.myText]}>
                            {item.content}
                        </Text>
                    )}
                    <View style={styles.metaRow}>
                        <Text style={[styles.timeText, isMe && { color: "rgba(255,255,255,0.5)" }]}>
                            {new Date(item.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </Text>
                        {isMe && (
                            <Ionicons
                                name={item.read ? "checkmark-done" : "checkmark"}
                                size={14}
                                color={item.read ? "#60A5FA" : "rgba(255,255,255,0.4)"}
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // ─── Loading State ───
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading chat...</Text>
            </View>
        );
    }

    // ─── Determine deal display logic ───
    const canAccept =
        dealData?.status === "PENDING" &&
        dealData.lastOfferBy !== myId;
    const canCounter = dealData?.status === "PENDING";
    const canReject = dealData?.status === "PENDING";
    const showInvoice = dealData?.status === "ACCEPTED";

    const myRole = otherUser?.role === "buyer" ? "farmer" : "buyer";
    const canPayEscrow = dealData?.status === "ACCEPTED" && (dealData.paymentStatus === "unpaid" || !dealData.paymentStatus) && myRole === "buyer";
    const canMarkDelivered = dealData?.status === "ACCEPTED" && dealData.paymentStatus === "held_in_escrow" && myRole === "farmer";
    const isEscrowHeldBuyer = dealData?.paymentStatus === "held_in_escrow" && myRole === "buyer";
    const isReleased = dealData?.paymentStatus === "released";

    const statusColors: Record<string, string> = {
        PENDING: "#D97706",
        ACCEPTED: "#16A34A",
        REJECTED: "#DC2626",
        EXPIRED: "#64748B",
    };

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ─── Header Bar ─── */}
            <View style={styles.headerBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName} numberOfLines={1}>
                        {otherUser?.name || "Chat"}
                    </Text>
                    {otherUser?.role && (
                        <Text style={styles.headerRole}>
                            {otherUser.role === "buyer" ? "Buyer" : "Farmer"}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* ─── Deal Panel ─── */}
            {dealData && (
                <View style={styles.dealPanel}>
                    <View style={styles.dealTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.dealCrop}>
                                {dealData.crop} · {dealData.quantityKg}kg
                            </Text>
                            <Text style={styles.dealOffer}>
                                ₹{dealData.currentOffer}
                                <Text style={styles.dealUnit}> per kg</Text>
                            </Text>
                            <Text style={styles.dealTotal}>
                                Total: ₹{(dealData.currentOffer * dealData.quantityKg).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.dealRight}>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            (statusColors[dealData.status] || "#64748B") + "18",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        { color: statusColors[dealData.status] || "#64748B" },
                                    ]}
                                >
                                    {dealData.status}
                                </Text>
                            </View>
                            {dealData.status === "PENDING" && expiryText && (
                                <Text style={styles.expiryText}>⏱ {expiryText}</Text>
                            )}
                        </View>
                    </View>

                    {/* Deal Actions */}
                    <View style={styles.dealActions}>
                        {canAccept && (
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={handleAcceptDeal}
                            >
                                <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                                <Text style={styles.actionBtnText}>Accept</Text>
                            </TouchableOpacity>
                        )}
                        {canCounter && (
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => {
                                    setCounterPrice(String(dealData.currentOffer));
                                    setCounterModalVisible(true);
                                }}
                            >
                                <Ionicons name="swap-horizontal" size={16} color="#2563EB" />
                                <Text style={styles.counterBtnText}>Counter</Text>
                            </TouchableOpacity>
                        )}
                        {canReject && (
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={handleRejectDeal}
                            >
                                <Ionicons name="close-circle" size={16} color="#DC2626" />
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                        )}
                        {canPayEscrow && (
                            <TouchableOpacity
                                style={[styles.acceptBtn, { backgroundColor: "#2563EB" }]}
                                onPress={() => router.push(`/payment/${dealData._id}`)}
                            >
                                <Ionicons name="card" size={16} color="#FFF" />
                                <Text style={styles.actionBtnText}>Pay via Escrow</Text>
                            </TouchableOpacity>
                        )}
                        {canMarkDelivered && (
                            <TouchableOpacity
                                style={[styles.acceptBtn, { backgroundColor: "#10B981" }]}
                                onPress={handleReleaseFunds}
                            >
                                <Ionicons name="cube" size={16} color="#FFF" />
                                <Text style={styles.actionBtnText}>Mark Delivered</Text>
                            </TouchableOpacity>
                        )}
                        {isEscrowHeldBuyer && (
                            <View style={[styles.acceptBtn, { backgroundColor: "#64748B" }]}>
                                <Ionicons name="lock-closed" size={16} color="#FFF" />
                                <Text style={styles.actionBtnText}>Funds Held</Text>
                            </View>
                        )}
                        {isReleased && (
                            <View style={[styles.acceptBtn, { backgroundColor: "#10B981" }]}>
                                <Ionicons name="checkmark-done" size={16} color="#FFF" />
                                <Text style={styles.actionBtnText}>Payment Released</Text>
                            </View>
                        )}
                        {showInvoice && (
                            <TouchableOpacity
                                style={styles.invoiceBtn}
                                onPress={handleDownloadInvoice}
                            >
                                <Ionicons name="document-text" size={16} color="#FFF" />
                                <Text style={styles.actionBtnText}>Download Invoice</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* ─── Messages List ─── */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item._id || `msg_${index}`}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: false })
                }
                ListEmptyComponent={
                    <View style={styles.emptyChat}>
                        <Ionicons name="chatbubble-outline" size={40} color="#CBD5E1" />
                        <Text style={styles.emptyChatText}>
                            No messages yet. Say hello!
                        </Text>
                    </View>
                }
            />

            {/* ─── Input Area ─── */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <View style={styles.inputArea}>
                    <TouchableOpacity
                        onPress={pickImage}
                        style={styles.iconBtn}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#64748B" />
                        ) : (
                            <Ionicons name="image-outline" size={24} color="#64748B" />
                        )}
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#94A3B8"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={2000}
                    />

                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={!inputText.trim() || sending}
                        style={[
                            styles.sendBtn,
                            inputText.trim() && styles.sendBtnActive,
                        ]}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={inputText.trim() ? "#FFF" : "#CBD5E1"}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* ─── Counter-Offer Modal ─── */}
            <Modal
                visible={counterModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCounterModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setCounterModalVisible(false)}
                >
                    <Pressable style={styles.modalCard} onPress={() => { }}>
                        <Text style={styles.modalTitle}>Make Counter-Offer</Text>
                        {dealData && (
                            <Text style={styles.modalSubtitle}>
                                {dealData.crop} · {dealData.quantityKg}kg · Current: ₹
                                {dealData.currentOffer}
                            </Text>
                        )}

                        <Text style={styles.modalLabel}>Your Price (₹ per kg)</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={counterPrice}
                            onChangeText={setCounterPrice}
                            keyboardType="numeric"
                            placeholder="Enter price"
                            placeholderTextColor="#94A3B8"
                            autoFocus
                        />

                        {counterPrice && dealData && (
                            <Text style={styles.modalTotal}>
                                Total: ₹
                                {(
                                    parseFloat(counterPrice || "0") * dealData.quantityKg
                                ).toLocaleString()}
                            </Text>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setCounterModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSubmitBtn}
                                onPress={handleCounterOffer}
                            >
                                <Text style={styles.modalSubmitText}>Send Offer</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ─── Image Preview Modal ─── */}
            <Modal
                visible={!!previewImage}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewImage(null)}
            >
                <Pressable
                    style={styles.imagePreviewOverlay}
                    onPress={() => setPreviewImage(null)}
                >
                    <TouchableOpacity
                        style={styles.imageCloseBtn}
                        onPress={() => setPreviewImage(null)}
                    >
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    {previewImage && (
                        <Image
                            source={{ uri: previewImage }}
                            style={styles.imagePreview}
                            resizeMode="contain"
                        />
                    )}
                </Pressable>
            </Modal>
        </View>
    );
}

// ─── Styles ───
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F1F5F9" },

    // Header
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingTop: Platform.OS === "ios" ? 56 : 12,
        paddingBottom: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    backBtn: { padding: 6 },
    headerInfo: { flex: 1, marginLeft: 10 },
    headerName: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
    headerRole: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748B",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    refreshBtn: { padding: 6 },

    // Deal Panel
    dealPanel: {
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dealTop: { flexDirection: "row", justifyContent: "space-between" },
    dealCrop: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
    dealOffer: { fontSize: 20, fontWeight: "900", color: "#0F172A", marginTop: 2 },
    dealUnit: { fontSize: 12, fontWeight: "500", color: "#64748B" },
    dealTotal: { fontSize: 12, fontWeight: "600", color: "#64748B", marginTop: 2 },
    dealRight: { alignItems: "flex-end" },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 2,
    },
    statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
    expiryText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#D97706",
        marginTop: 6,
    },
    dealActions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
        flexWrap: "wrap",
    },
    acceptBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#16A34A",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 2,
        gap: 6,
    },
    counterBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        gap: 6,
    },
    rejectBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: "#FECACA",
        gap: 6,
    },
    invoiceBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#7C3AED",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 2,
        gap: 6,
    },
    actionBtnText: { color: "#FFF", fontSize: 13, fontWeight: "800" },
    counterBtnText: { color: "#2563EB", fontSize: 13, fontWeight: "800" },
    rejectBtnText: { color: "#DC2626", fontSize: 13, fontWeight: "800" },

    // Messages
    listContent: { padding: 12, paddingBottom: 8 },
    msgWrapper: { marginBottom: 6, maxWidth: "80%" },
    myMsg: { alignSelf: "flex-end" },
    theirMsg: { alignSelf: "flex-start" },
    msgCloud: { padding: 10, borderRadius: 12 },
    myCloud: { backgroundColor: "#0F172A", borderBottomRightRadius: 2 },
    theirCloud: {
        backgroundColor: "#FFFFFF",
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    optimisticCloud: { opacity: 0.6 },
    msgText: { fontSize: 15, color: "#1E293B", lineHeight: 20 },
    myText: { color: "#FFFFFF" },
    msgImage: {
        width: 220,
        height: 165,
        borderRadius: 8,
        marginBottom: 4,
        backgroundColor: "#E2E8F0",
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 4,
    },
    timeText: { fontSize: 10, color: "#94A3B8" },

    emptyChat: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
    },
    emptyChatText: { marginTop: 12, color: "#94A3B8", fontSize: 14 },

    // Input
    inputArea: {
        flexDirection: "row",
        padding: 10,
        backgroundColor: "#FFFFFF",
        alignItems: "flex-end",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    input: {
        flex: 1,
        marginHorizontal: 8,
        backgroundColor: "#F1F5F9",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
        color: "#0F172A",
    },
    iconBtn: { padding: 8 },
    sendBtn: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: "#E2E8F0",
    },
    sendBtnActive: { backgroundColor: "#2563EB" },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
    },
    loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },

    // Counter-Offer Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalCard: {
        width: "100%",
        backgroundColor: "#FFF",
        borderRadius: 4,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
            android: { elevation: 10 },
        }),
    },
    modalTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
    modalSubtitle: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
        marginTop: 4,
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748B",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    modalInput: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 4,
        paddingHorizontal: 16,
        height: 52,
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A",
    },
    modalTotal: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: "700",
        color: "#16A34A",
    },
    modalActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 24,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 2,
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    modalCancelText: { fontWeight: "800", color: "#64748B", fontSize: 14 },
    modalSubmitBtn: {
        flex: 1.5,
        paddingVertical: 14,
        borderRadius: 2,
        alignItems: "center",
        backgroundColor: "#2563EB",
    },
    modalSubmitText: { fontWeight: "800", color: "#FFF", fontSize: 14 },

    // Image Preview
    imagePreviewOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    imageCloseBtn: {
        position: "absolute",
        top: Platform.OS === "ios" ? 56 : 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    imagePreview: { width: "90%", height: "70%" },
});
