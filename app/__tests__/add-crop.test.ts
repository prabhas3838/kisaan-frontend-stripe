import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit Tests for Add Crop Functionality
 * 
 * These tests verify the core logic of the add-crop feature:
 * - Data validation
 * - AsyncStorage operations
 * - Data structure integrity
 */

// Mock AsyncStorage
const AsyncStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

describe('Add Crop - Core Logic Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        AsyncStorage.getItem.mockResolvedValue(null);
        AsyncStorage.setItem.mockResolvedValue(undefined);
    });

    describe('Data Validation', () => {
        it('should validate required fields are present', () => {
            const cropData = {
                category: 'Vegetables',
                crop: 'Tomato',
                quantity: '100',
                price: '5000',
            };

            const isValid = validateCropData(cropData);
            expect(isValid).toBe(true);
        });

        it('should reject data with missing fields', () => {
            const incompleteCropData = {
                category: 'Vegetables',
                crop: '',
                quantity: '100',
                price: '5000',
            };

            const isValid = validateCropData(incompleteCropData);
            expect(isValid).toBe(false);
        });

        it('should reject negative quantity', () => {
            const invalidCropData = {
                category: 'Vegetables',
                crop: 'Tomato',
                quantity: '-10',
                price: '5000',
            };

            const isValid = validateCropData(invalidCropData);
            expect(isValid).toBe(false);
        });

        it('should reject negative price', () => {
            const invalidCropData = {
                category: 'Vegetables',
                crop: 'Tomato',
                quantity: '100',
                price: '-500',
            };

            const isValid = validateCropData(invalidCropData);
            expect(isValid).toBe(false);
        });
    });

    describe('Listing Creation', () => {
        it('should create listing with unique ID', () => {
            const cropData = {
                category: 'Vegetables',
                crop: 'Tomato',
                quantity: '100',
                price: '5000',
            };

            const listing = createCropListing(cropData);

            expect(listing).toHaveProperty('id');
            expect(listing.id).toBeTruthy();
            expect(listing.id).toBeTypeOf('string');
        });

        it('should create listing with timestamp', () => {
            const cropData = {
                category: 'Vegetables',
                crop: 'Tomato',
                quantity: '100',
                price: '5000',
            };

            const listing = createCropListing(cropData);

            expect(listing).toHaveProperty('createdAt');
            expect(listing.createdAt).toBeTruthy();
            const createdDate = new Date(listing.createdAt);
            expect(createdDate.getTime()).toBeLessThanOrEqual(Date.now());
        });

        it('should preserve all crop data fields', () => {
            const cropData = {
                category: 'Fruits',
                crop: 'Apple',
                quantity: '50',
                price: '8000',
            };

            const listing = createCropListing(cropData);

            expect(listing.category).toBe('Fruits');
            expect(listing.crop).toBe('Apple');
            expect(listing.quantity).toBe('50');
            expect(listing.price).toBe('8000');
        });
    });

    describe('AsyncStorage Integration', () => {
        it('should save new listing to empty storage', async () => {
            const newListing = {
                id: '1',
                category: 'Vegetables',
                crop: 'Tomato',
                quantity: '100',
                price: '5000',
                createdAt: new Date().toISOString(),
            };

            await saveCropListing(newListing, AsyncStorage);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                'cropListings',
                JSON.stringify([newListing])
            );
        });

        it('should append new listing to existing listings', async () => {
            const existingListings = [
                {
                    id: '1',
                    category: 'Vegetables',
                    crop: 'Tomato',
                    quantity: '100',
                    price: '5000',
                    createdAt: new Date().toISOString(),
                },
            ];

            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingListings));

            const newListing = {
                id: '2',
                category: 'Fruits',
                crop: 'Apple',
                quantity: '50',
                price: '8000',
                createdAt: new Date().toISOString(),
            };

            await saveCropListing(newListing, AsyncStorage);

            const savedData = AsyncStorage.setItem.mock.calls[0][1];
            const parsedData = JSON.parse(savedData);

            expect(parsedData).toHaveLength(2);
            expect(parsedData[1].id).toBe('2');
        });
    });
});

// Helper functions (these would normally be in your component or utils)
function validateCropData(data: any): boolean {
    if (!data.category || !data.crop || !data.quantity || !data.price) {
        return false;
    }
    if (parseFloat(data.quantity) < 0 || parseFloat(data.price) < 0) {
        return false;
    }
    return true;
}

function createCropListing(cropData: any) {
    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...cropData,
        createdAt: new Date().toISOString(),
    };
}

async function saveCropListing(listing: any, storage: any) {
    const existingData = await storage.getItem('cropListings');
    const existingListings = existingData ? JSON.parse(existingData) : [];
    const updatedListings = [...existingListings, listing];
    await storage.setItem('cropListings', JSON.stringify(updatedListings));
}
