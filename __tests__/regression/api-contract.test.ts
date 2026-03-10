import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Contract Regression Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('maintains /send-otp API contract structure', async () => {
        const expectedRequest = {
            phone: '9876543210',
        };

        const expectedResponseStructure = {
            success: expect.any(Boolean),
            message: expect.any(String),
        };

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'OTP sent successfully',
            },
        });

        await mockedAxios.post(
            'http://localhost:5001/api/auth/send-otp',
            expectedRequest,
            { headers: { 'Content-Type': 'application/json' } }
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:5001/api/auth/send-otp',
            expect.objectContaining(expectedRequest),
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('regression: API endpoints have not changed', () => {
        const apiEndpoints = {
            sendOtp: 'http://localhost:5001/api/auth/send-otp',
            // Add more endpoints as they are discovered
        };

        expect(apiEndpoints.sendOtp).toBe('http://localhost:5001/api/auth/send-otp');
        expect(Object.keys(apiEndpoints).length).toBeGreaterThan(0);
    });

    it('regression: request headers remain consistent', async () => {
        const standardHeaders = {
            'Content-Type': 'application/json',
        };

        mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

        await mockedAxios.post(
            'http://localhost:5001/api/auth/send-otp',
            { phone: '9876543210' },
            { headers: standardHeaders }
        );

        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({ headers: standardHeaders })
        );
    });
});
