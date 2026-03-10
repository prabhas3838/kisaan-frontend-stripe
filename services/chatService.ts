import { ENDPOINTS } from "./api";
import { apiFetch } from "./http";

export const chatService = {
    /** POST /api/chat/init — Create or fetch a chat between current user and recipient */
    getOrCreateChat: async (recipientId: string, dealId?: string) => {
        return apiFetch<any>(ENDPOINTS.CHAT.INIT, {
            method: "POST",
            body: JSON.stringify({ recipientId, dealId }),
        });
    },

    /** GET /api/chat/my-chats — All chats for the current user */
    getUserChats: async () => {
        return apiFetch<any>(ENDPOINTS.CHAT.MY_CHATS, {
            method: "GET",
        });
    },

    /** GET /api/chat/:chatId — Full message history for a chat */
    getChatMessages: async (chatId: string) => {
        return apiFetch<any>(ENDPOINTS.CHAT.MESSAGES(chatId), {
            method: "GET",
        });
    },

    /** POST /api/chat/upload — Upload an image (multipart/form-data) */
    uploadImage: async (formData: FormData) => {
        return apiFetch<any>(ENDPOINTS.CHAT.UPLOAD, {
            method: "POST",
            body: formData,
            headers: {
                // Remove Content-Type so fetch sets boundary correctly for FormData
                "Content-Type": undefined as any,
            },
        });
    }
};
