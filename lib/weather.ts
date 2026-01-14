// Open-Meteo Weather API - Free, no API key required
// https://open-meteo.com/

export interface DailyWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed: number;
}

export interface WeatherData {
  daily: DailyWeather[];
  location: {
    latitude: number;
    longitude: number;
  };
}

// Weather code descriptions based on WMO codes
// https://open-meteo.com/en/docs
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}

export function getWeatherIcon(code: number): string {
  // Return emoji based on weather code
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

export function isWeatherWarning(weather: DailyWeather): boolean {
  // Warning if high rain probability or severe weather
  return (
    weather.precipitationProbability >= 50 ||
    weather.weatherCode >= 63 ||
    weather.windSpeed >= 40
  );
}

export async function fetchWeatherForecast(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max',
      timezone: 'auto',
      forecast_days: '14',
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    const daily: DailyWeather[] = data.daily.time.map(
      (date: string, index: number) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[index]),
        tempMin: Math.round(data.daily.temperature_2m_min[index]),
        precipitationProbability:
          data.daily.precipitation_probability_max[index] || 0,
        weatherCode: data.daily.weather_code[index],
        windSpeed: Math.round(data.daily.wind_speed_10m_max[index]),
      })
    );

    return {
      daily,
      location: { latitude, longitude },
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// Default coordinates for Australian cities
export const DEFAULT_LOCATIONS: Record<string, { lat: number; lon: number }> = {
  sydney: { lat: -33.8688, lon: 151.2093 },
  melbourne: { lat: -37.8136, lon: 144.9631 },
  brisbane: { lat: -27.4698, lon: 153.0251 },
  perth: { lat: -31.9505, lon: 115.8605 },
  adelaide: { lat: -34.9285, lon: 138.6007 },
  hobart: { lat: -42.8821, lon: 147.3272 },
  darwin: { lat: -12.4634, lon: 130.8456 },
  canberra: { lat: -35.2809, lon: 149.13 },
};

// Get user's location or fall back to default
export async function getUserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Fall back to Sydney if geolocation fails
          resolve(DEFAULT_LOCATIONS.sydney);
        },
        { timeout: 5000 }
      );
    } else {
      resolve(DEFAULT_LOCATIONS.sydney);
    }
  });
}
