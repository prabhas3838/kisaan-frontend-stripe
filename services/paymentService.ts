import { ENDPOINTS } from "./api";
import { apiFetch } from "./http";

export const paymentService = {
    createIntent: (dealId: string) => apiFetch<any>(ENDPOINTS.PAYMENTS.INTENT(dealId), { method: "POST" }),
    confirmEscrow: (dealId: string) => apiFetch<any>(ENDPOINTS.PAYMENTS.CONFIRM(dealId), { method: "POST" }),
    releaseFunds: (dealId: string) => apiFetch<any>(ENDPOINTS.PAYMENTS.RELEASE(dealId), { method: "POST" }),
};
