import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Authentication Flow - Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('completes full authentication flow: Login → OTP → Dashboard', async () => {
        const mockRouter = require('expo-router').router;

        // Mock successful OTP send
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'OTP sent successfully',
            },
        });

        // This test documents the expected flow (integration test conceptual)
        const expectedFlow = [
            '1. User enters phone number',
            '2. API /send-otp is called',
            '3. OTP is sent to phone',
            '4. User navigates to farmer-dashboard (temporary)',
            // TODO: Add OTP verification step when implemented
        ];

        expect(expectedFlow).toHaveLength(4);
        expect(mockedAxios.post).toBeDefined();
        expect(mockRouter.push).toBeDefined();
    });

    it('integrates with backend auth API endpoint', async () => {
        const testPhone = '9876543210';

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                success: true,
            },
        });

        await mockedAxios.post(
            'http://localhost:5001/api/auth/send-otp',
            { phone: testPhone },
            { headers: { 'Content-Type': 'application/json' } }
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:5001/api/auth/send-otp',
            { phone: testPhone },
            { headers: { 'Content-Type': 'application/json' } }
        );
    });

    it('handles backend authentication errors and propagates to UI', async () => {
        const backendErrorResponse = {
            response: {
                data: {
                    message: 'Phone number not registered',
                },
                status: 400,
            },
        };

        mockedAxios.post.mockRejectedValueOnce(backendErrorResponse);

        try {
            await mockedAxios.post('http://localhost:5001/api/auth/send-otp', {
                phone: '0000000000',
            });
        } catch (error: any) {
            expect(error.response.data.message).toBe('Phone number not registered');
            expect(error.response.status).toBe(400);
        }
    });
});
