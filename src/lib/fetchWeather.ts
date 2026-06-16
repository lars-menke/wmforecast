const VENUE_COORDS: Record<string, { lat: number; lon: number }> = {
  'MetLife Stadium':           { lat: 40.8135, lon: -74.0745 },
  'AT&T Stadium':              { lat: 32.7473, lon: -97.0945 },
  'SoFi Stadium':              { lat: 33.9534, lon: -118.3388 },
  'Rose Bowl':                 { lat: 34.1613, lon: -118.1676 },
  'Lumen Field':               { lat: 47.5952, lon: -122.3316 },
  'Arrowhead Stadium':         { lat: 39.0489, lon: -94.4839 },
  'Lincoln Financial Field':   { lat: 39.9008, lon: -75.1675 },
  'Gillette Stadium':          { lat: 42.0909, lon: -71.2643 },
  'BMO Field':                 { lat: 43.6328, lon: -79.4189 },
  'BC Place':                  { lat: 49.2767, lon: -123.1115 },
  'Estadio Azteca':            { lat: 19.3029, lon: -99.1504 },
  'Estadio Akron':             { lat: 20.6717, lon: -103.4153 },
  'Estadio BBVA':              { lat: 25.6694, lon: -100.2403 },
};

export type WeatherData = {
  tempC: number;
  precipPct: number;
  code: number;
};

export function weatherDesc(code: number): { label: string; emoji: string } {
  if (code === 0)   return { label: 'Klar',         emoji: '☀️' };
  if (code <= 2)    return { label: 'Teils wolkig', emoji: '⛅' };
  if (code === 3)   return { label: 'Bedeckt',      emoji: '☁️' };
  if (code <= 49)   return { label: 'Nebel',        emoji: '🌫️' };
  if (code <= 59)   return { label: 'Nieselregen',  emoji: '🌦️' };
  if (code <= 69)   return { label: 'Regen',        emoji: '🌧️' };
  if (code <= 79)   return { label: 'Schnee',       emoji: '❄️' };
  if (code <= 84)   return { label: 'Regenschauer', emoji: '🌧️' };
  if (code <= 94)   return { label: 'Gewitter',     emoji: '⛈️' };
  return                   { label: 'Unwetter',     emoji: '🌩️' };
}

function resolveCoords(venue?: string): { lat: number; lon: number } | null {
  if (!venue) return null;
  const name = venue.split(',')[0].trim();
  return VENUE_COORDS[name] ?? null;
}

export async function fetchWeather(
  venue: string | undefined,
  kickoffISO: string,
): Promise<WeatherData | null> {
  const coords = resolveCoords(venue);
  if (!coords) return null;

  try {
    const kickoff = new Date(kickoffISO);
    const dateStr = kickoff.toISOString().slice(0, 10);
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&hourly=temperature_2m,precipitation_probability,weathercode` +
      `&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;

    const r = await fetch(url);
    if (!r.ok) return null;

    const json = await r.json() as {
      hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
        weathercode: number[];
      };
    };

    const times = json.hourly.time;
    const kickoffMs = kickoff.getTime();
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(new Date(times[i]).getTime() - kickoffMs);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }

    return {
      tempC: Math.round(json.hourly.temperature_2m[bestIdx]),
      precipPct: json.hourly.precipitation_probability[bestIdx] ?? 0,
      code: json.hourly.weathercode[bestIdx] ?? 0,
    };
  } catch {
    return null;
  }
}
