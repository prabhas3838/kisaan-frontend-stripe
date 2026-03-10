/**
 * Govt Schemes Service
 * Fetches agricultural schemes from a public source.
 */

export type Scheme = {
    id: string;
    title: string;
    category: string;
    benefits: string;
    eligibility: string;
    description: string;
    link?: string;
};

export const govtService = {
    getSchemes: async (): Promise<Scheme[]> => {
        // In a real app, this would be a public API. 
        // We'll mimic a network call to a public data source.

        // Curated high-quality list of top 5 Indian agricultural schemes
        const data: Scheme[] = [
            {
                id: "1",
                title: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
                category: "Financial Support",
                description: "Direct income support of ₹6,000 per year to all landholding farmer families.",
                benefits: "₹6,000 yearly in three equal installments directly to bank accounts.",
                eligibility: "All landholding farmer families (with some exclusion criteria).",
                link: "https://pmkisan.gov.in/"
            },
            {
                id: "2",
                title: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
                category: "Insurance",
                description: "Crop insurance scheme to provide financial support to farmers suffering crop loss/damage.",
                benefits: "Comprehensive insurance cover against failure of crops.",
                eligibility: "All farmers including sharecroppers and tenant farmers.",
                link: "https://pmfby.gov.in/"
            },
            {
                id: "3",
                title: "KCC (Kisan Credit Card)",
                category: "Credit",
                description: "Provides farmers with timely access to credit for their cultivation and other needs.",
                benefits: "Low-interest loans for crops and equipment.",
                eligibility: "All farmers, individuals or joint borrowers who are owner-cultivators.",
                link: "https://www.rbi.org.in/"
            },
            {
                id: "4",
                title: "PM-KMY (Pradhan Mantri Kisan Maan-Dhan Yojana)",
                category: "Pension",
                description: "Voluntary and contributory pension scheme for small and marginal farmers.",
                benefits: "Monthly pension of ₹3,000 after attaining the age of 60 years.",
                eligibility: "Small and marginal farmers aged 18 to 40 years.",
                link: "https://pmkmy.gov.in/"
            },
            {
                id: "5",
                title: "eNAM (National Agriculture Market)",
                category: "Marketplace",
                description: "Pan-India electronic trading portal which networks existing APMC mandis.",
                benefits: "Better price discovery and transparent transaction environment.",
                eligibility: "Farmers, Mandis, and Traders across India.",
                link: "https://enam.gov.in/"
            }
        ];

        return new Promise((resolve) => {
            setTimeout(() => resolve(data), 800);
        });
    }
};
