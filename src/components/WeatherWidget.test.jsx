import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WeatherWidget from './WeatherWidget';

let mockSettings = { useCelsius: true, fallbackCity: 'London' };

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => {
        return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
    }),
}));

const mockWeatherData = {
    current: {
        temperature_2m: 20,
        apparent_temperature: 18,
        relative_humidity_2m: 50,
        wind_speed_10m: 10,
        weather_code: 0,
    },
    daily: {
        time: ['2023-01-01', '2023-01-02'],
        temperature_2m_max: [25, 26],
        temperature_2m_min: [15, 16],
        weather_code: [0, 0],
        sunrise: ['2023-01-01T06:00'],
        sunset: ['2023-01-01T18:00'],
    },
};

describe('WeatherWidget', () => {
    let mockGeolocation;

    beforeEach(() => {
        localStorage.clear();
        mockSettings = { useCelsius: true, fallbackCity: 'London' };
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockWeatherData,
        });
        mockGeolocation = {
            getCurrentPosition: vi.fn().mockImplementation((success) =>
                success({ coords: { latitude: 51.5074, longitude: -0.1278 } })
            ),
        };
        vi.stubGlobal('navigator', { geolocation: mockGeolocation });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders weather data after fetching with Celsius', async () => {
        render(<WeatherWidget />);

        await waitFor(() => {
            expect(screen.getByText(/20°C/i)).toBeTruthy();
        });
    });

    it('displays Fahrenheit when useCelsius is false', async () => {
        mockSettings.useCelsius = false;
        render(<WeatherWidget />);

        await waitFor(() => {
            expect(screen.getByText(/20°F/i)).toBeTruthy();
        });
    });

    it('loads cached weather immediately if present in localStorage', () => {
        const cached = {
            key: JSON.stringify([true, 'London']),
            locationSource: 'gps',
            iconType: 'sun',
            weatherCode: 0,
            temp: '22°C',
            feelsLike: '21°C',
            humidity: '45%',
            wind: '12 km/h',
            sunrise: '06:30',
            sunset: '20:15',
            forecast: [],
            timestamp: Date.now(),
        };
        localStorage.setItem('dash_weather_cache', JSON.stringify(cached));

        render(<WeatherWidget />);
        expect(screen.getByText(/22°C/i)).toBeTruthy();
    });

    it('shows error state when network fetch fails and allows retry', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        render(<WeatherWidget />);

        await waitFor(() => {
            expect(screen.getByLabelText('Weather Error')).toBeTruthy();
        });

        // Now mock successful response on retry
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockWeatherData,
        });

        const retryBtn = screen.getByLabelText('Weather Error');
        await act(async () => {
            fireEvent.click(retryBtn);
        });

        await waitFor(() => {
            expect(screen.getByText(/20°C/i)).toBeTruthy();
        });
    });

    it('opens and closes expanded weather panel on toggle click', async () => {
        const { container } = render(<WeatherWidget />);

        await waitFor(() => {
            expect(screen.getByText(/20°C/i)).toBeTruthy();
        });

        const toggleBtn = container.querySelector('#weatherWidget');
        const panel = container.querySelector('#weatherPanel');
        expect(toggleBtn).toBeTruthy();
        expect(panel).toBeTruthy();

        // Open panel
        fireEvent.click(toggleBtn);
        expect(panel.classList.contains('open')).toBe(true);

        // Close panel
        fireEvent.click(toggleBtn);
        expect(panel.classList.contains('open')).toBe(false);
    });
});
