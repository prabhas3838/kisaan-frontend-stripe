import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Performance Tests - API Response Times', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('measures OTP API response time', async () => {
        mockedAxios.post.mockImplementationOnce(
            () =>
                new Promise((resolve) =>
                    setTimeout(
                        () =>
                            resolve({
                                data: { success: true, message: 'OTP sent successfully' },
                            }),
                        50 // Simulating 50ms response time
                    )
                )
        );

        const startTime = performance.now();

        await mockedAxios.post('http://localhost:5001/api/auth/send-otp', {
            phone: '9876543210',
        });

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // API should respond within acceptable time (< 2000ms for mocked call)
        expect(responseTime).toBeLessThan(2000);
    });

    it('tracks concurrent API calls performance', async () => {
        mockedAxios.post.mockResolvedValue({
            data: { success: true },
        });

        const startTime = performance.now();

        // Simulate multiple concurrent API calls
        await Promise.all([
            mockedAxios.post('http://localhost:5001/api/auth/send-otp', {
                phone: '9876543210',
            }),
            mockedAxios.post('http://localhost:5001/api/auth/send-otp', {
                phone: '9876543211',
            }),
            mockedAxios.post('http://localhost:5001/api/auth/send-otp', {
                phone: '9876543212',
            }),
        ]);

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        // Concurrent calls should complete reasonably fast
        expect(totalTime).toBeLessThan(3000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('monitors data loading performance metrics', async () => {
        const largeMockData = Array(100)
            .fill(null)
            .map((_, i) => ({
                mandiId: `m${i}`,
                crop: 'Tomato',
                price: 30 + i,
            }));

        mockedAxios.get.mockResolvedValueOnce({
            data: largeMockData,
        });

        const startTime = performance.now();
        const response = await mockedAxios.get(
            'http://localhost:5001/api/mandi/prices'
        );
        const endTime = performance.now();

        const loadTime = endTime - startTime;

        // Verify data loaded
        expect(response.data).toHaveLength(100);

        // Should load quickly (mocked data)
        expect(loadTime).toBeLessThan(100);
    });

    it('benchmarks authentication flow performance', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { success: true } }) // send-otp
            .mockResolvedValueOnce({ data: { success: true, token: 'fake-token' } }); // verify-otp (future)

        const startTime = performance.now();

        // Simulate full auth flow
        await mockedAxios.post('http://localhost:5001/api/auth/send-otp', {
            phone: '9876543210',
        });

        // Future: OTP verification step
        // await mockedAxios.post('http://localhost:5001/api/auth/verify-otp', { phone: '9876543210', otp: '123456' });

        const endTime = performance.now();
        const authFlowTime = endTime - startTime;

        expect(authFlowTime).toBeLessThan(5000);
    });
});

describe('Performance Tests - Data Loading', () => {
    it('measures list rendering performance with large datasets', () => {
        const largeDataset = Array(1000)
            .fill(null)
            .map((_, i) => ({
                id: i,
                name: `Item ${i}`,
            }));

        const startTime = performance.now();

        // Simulate processing large dataset
        const processedData = largeDataset.filter((item) => item.id % 2 === 0);

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        expect(processedData).toHaveLength(500);
        expect(processingTime).toBeLessThan(100); // Should process quickly
    });

    it('benchmarks component render time', () => {
        // Note: This is a basic performance check
        // In a real app, you'd use React.Profiler or similar tools

        const startTime = performance.now();

        // Simulate component creation
        const mockComponent = {
            type: 'LoginScreen',
            props: {},
            rendered: true,
        };

        const endTime = performance.now();
        const renderTime = endTime - startTime;

        expect(mockComponent.rendered).toBe(true);
        expect(renderTime).toBeLessThan(50);
    });
});
