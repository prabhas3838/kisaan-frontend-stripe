import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../app/login';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Login Screen - Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login screen with all elements', () => {
        const { getByText, getByPlaceholderText } = render(<LoginScreen />);

        expect(getByText('auth.welcome')).toBeTruthy();
        expect(getByText('auth.enter_phone')).toBeTruthy();
        expect(getByPlaceholderText('auth.phone_placeholder')).toBeTruthy();
        expect(getByText('auth.continue')).toBeTruthy();
    });

    it('validates phone number format correctly', async () => {
        const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);

        const phoneInput = getByPlaceholderText('auth.phone_placeholder');
        const continueButton = getByText('auth.continue');

        // Test invalid phone (too short)
        fireEvent.changeText(phoneInput, '123');
        fireEvent.press(continueButton);

        await waitFor(() => {
            expect(queryByText('auth.invalid_phone')).toBeTruthy();
        });
    });

    it('accepts only 10-digit numeric phone numbers', () => {
        const { getByPlaceholderText } = render(<LoginScreen />);
        const phoneInput = getByPlaceholderText('auth.phone_placeholder');

        // Test non-numeric input is filtered out
        fireEvent.changeText(phoneInput, '98765abc43');

        // The component should strip non-numeric characters
        expect(phoneInput.props.value).not.toContain('a');
        expect(phoneInput.props.value).not.toContain('b');
        expect(phoneInput.props.value).not.toContain('c');
    });

    it('sends OTP request on valid phone submission', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { success: true },
        });

        const { getByPlaceholderText, getByText } = render(<LoginScreen />);

        const phoneInput = getByPlaceholderText('auth.phone_placeholder');
        const continueButton = getByText('auth.continue');

        fireEvent.changeText(phoneInput, '9876543210');
        fireEvent.press(continueButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:5001/api/auth/send-otp',
                { phone: '9876543210' },
                { headers: { 'Content-Type': 'application/json' } }
            );
        });
    });

    it('shows loading state while sending OTP', async () => {
        mockedAxios.post.mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
        );

        const { getByPlaceholderText, getByText } = render(<LoginScreen />);

        const phoneInput = getByPlaceholderText('auth.phone_placeholder');
        const continueButton = getByText('auth.continue');

        fireEvent.changeText(phoneInput, '9876543210');
        fireEvent.press(continueButton);

        // Should show loading text
        await waitFor(() => {
            expect(getByText('auth.sending_otp')).toBeTruthy();
        });
    });

    it('handles API error gracefully', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: {
                data: { message: 'Server error' },
            },
        });

        const { getByPlaceholderText, getByText } = render(<LoginScreen />);

        const phoneInput = getByPlaceholderText('auth.phone_placeholder');
        const continueButton = getByText('auth.continue');

        fireEvent.changeText(phoneInput, '9876543210');
        fireEvent.press(continueButton);

        await waitFor(() => {
            expect(getByText('Server error')).toBeTruthy();
        });
    });

    it('disables continue button during API call', async () => {
        mockedAxios.post.mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
        );

        const { getByPlaceholderText, getByText } = render(<LoginScreen />);

        const phoneInput = getByPlaceholderText('auth.phone_placeholder');
        const continueButton = getByText('auth.continue');

        fireEvent.changeText(phoneInput, '9876543210');
        fireEvent.press(continueButton);

        // Button should be disabled during loading
        await waitFor(() => {
            expect(continueButton.props.disabled).toBe(true);
        });
    });
});
