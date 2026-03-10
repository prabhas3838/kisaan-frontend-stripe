import { ENDPOINTS } from "./api";
import { apiFetch } from "./http";

export const dealService = {
    /** POST /api/deals — Create a new deal/negotiation */
    createDeal: async (dealData: {
        crop: string;
        buyerId: string;
        originalPrice: number;
        quantityKg: number;
    }) => {
        return apiFetch<any>(ENDPOINTS.DEALS.CREATE, {
            method: "POST",
            body: JSON.stringify(dealData),
        });
    },

    /** POST /api/deals/:id/offer — Make a counter-offer */
    makeOffer: async (dealId: string, price: number) => {
        return apiFetch<any>(ENDPOINTS.DEALS.ACTION(dealId, "offer"), {
            method: "POST",
            body: JSON.stringify({ price }),
        });
    },

    /** POST /api/deals/:id/accept — Accept the current offer */
    acceptOffer: async (dealId: string) => {
        return apiFetch<any>(ENDPOINTS.DEALS.ACTION(dealId, "accept"), {
            method: "POST",
            body: JSON.stringify({}),
        });
    },

    /** POST /api/deals/:id/reject — Reject the deal */
    rejectOffer: async (dealId: string) => {
        return apiFetch<any>(ENDPOINTS.DEALS.ACTION(dealId, "reject"), {
            method: "POST",
            body: JSON.stringify({}),
        });
    },

    /** GET /api/deals/:id — Get deal details (auto-checks expiry) */
    getDeal: async (dealId: string) => {
        return apiFetch<any>(ENDPOINTS.DEALS.GET(dealId), {
            method: "GET",
        });
    },

    /** GET /api/invoices/:dealId/download — Download PDF invoice for an accepted deal */
    downloadInvoice: async (dealId: string) => {
        // Special case for blob, apiFetch might need adjustment but for now let's use the centralized url
        return apiFetch<any>(ENDPOINTS.INVOICE(dealId), {
            method: "GET",
        });
    }
};
