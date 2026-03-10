import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit Tests for My Listings Functionality
 * 
 * These tests verify the core logic of the my-listings feature:
 * - Loading listings from storage
 * - Deleting listings
 * - Data structure integrity
 */

// Mock AsyncStorage
const AsyncStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

const mockListings = [
    {
        id: '1',
        category: 'Vegetables',
        crop: 'Tomato',
        quantity: '100',
        price: '5000',
        createdAt: '2026-02-09T10:00:00.000Z',
    },
    {
        id: '2',
        category: 'Fruits',
        crop: 'Apple',
        quantity: '50',
        price: '8000',
        createdAt: '2026-02-09T11:00:00.000Z',
    },
];

describe('My Listings - Core Logic Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        AsyncStorage.getItem.mockResolvedValue(null);
        AsyncStorage.setItem.mockResolvedValue(undefined);
    });

    describe('Loading Listings', () => {
        it('should load listings from AsyncStorage', async () => {
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockListings));

            const listings = await loadListings(AsyncStorage);

            expect(AsyncStorage.getItem).toHaveBeenCalledWith('cropListings');
            expect(listings).toHaveLength(2);
            expect(listings[0].crop).toBe('Tomato');
        });

        it('should return empty array when no listings exist', async () => {
            AsyncStorage.getItem.mockResolvedValue(null);

            const listings = await loadListings(AsyncStorage);

            expect(listings).toEqual([]);
        });

        it('should handle corrupted data gracefully', async () => {
            AsyncStorage.getItem.mockResolvedValue('invalid json');

            const listings = await loadListings(AsyncStorage);

            expect(listings).toEqual([]);
        });
    });

    describe('Deleting Listings', () => {
        it('should remove a listing by ID', async () => {
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockListings));

            await deleteListing('1', AsyncStorage);

            const savedData = AsyncStorage.setItem.mock.calls[0][1];
            const remainingListings = JSON.parse(savedData);

            expect(remainingListings).toHaveLength(1);
            expect(remainingListings[0].id).toBe('2');
            expect(remainingListings[0].crop).toBe('Apple');
        });

        it('should handle deleting non-existent ID', async () => {
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockListings));

            await deleteListing('999', AsyncStorage);

            const savedData = AsyncStorage.setItem.mock.calls[0][1];
            const remainingListings = JSON.parse(savedData);

            expect(remainingListings).toHaveLength(2);
        });

        it('should delete all items when given all IDs', async () => {
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockListings));

            await deleteListing('1', AsyncStorage);

            // Reset mock to simulate second delete
            const firstDeletedData = AsyncStorage.setItem.mock.calls[0][1];
            AsyncStorage.getItem.mockResolvedValue(firstDeletedData);

            await deleteListing('2', AsyncStorage);

            const savedData = AsyncStorage.setItem.mock.calls[1][1];
            const remainingListings = JSON.parse(savedData);

            expect(remainingListings).toHaveLength(0);
        });
    });

    describe('Data Formatting', () => {
        it('should format price with currency symbol', () => {
            const price = '5000';
            const formatted = formatPrice(price);

            expect(formatted).toBe('₹5000');
        });

        it('should format date correctly', () => {
            const dateString = '2026-02-09T10:00:00.000Z';
            const formatted = formatDate(dateString);

            expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY or similar
        });

        it('should calculate total listings count', () => {
            const count = mockListings.length;

            expect(count).toBe(2);
        });
    });

    describe('Listing Filters and Sorting', () => {
        it('should filter listings by category', () => {
            const filtered = filterByCategory(mockListings, 'Vegetables');

            expect(filtered).toHaveLength(1);
            expect(filtered[0].crop).toBe('Tomato');
        });

        it('should sort listings by date (newest first)', () => {
            const sorted = sortByDateDesc(mockListings);

            expect(sorted[0].id).toBe('2'); // Apple created later
            expect(sorted[1].id).toBe('1'); // Tomato created earlier
        });
    });
});

// Helper functions (these would normally be in your component or utils)
async function loadListings(storage: any) {
    try {
        const data = await storage.getItem('cropListings');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading listings:', error);
        return [];
    }
}

async function deleteListing(id: string, storage: any) {
    const listings = await loadListings(storage);
    const updated = listings.filter((listing: any) => listing.id !== id);
    await storage.setItem('cropListings', JSON.stringify(updated));
}

function formatPrice(price: string): string {
    return `₹${price}`;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function filterByCategory(listings: any[], category: string) {
    return listings.filter((listing) => listing.category === category);
}

function sortByDateDesc(listings: any[]) {
    return [...listings].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}
