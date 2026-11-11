const places = [
  {
    name: "თბილისი",
    country: "საქართველო",
    latitude: 41.7151,
    longitude: 44.8271,
  },
  {
    name: "ლონდონი",
    country: "დიდი ბრიტანეთი",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  { name: "ტოკიო", country: "იაპონია", latitude: 35.6762, longitude: 139.6503 },
  { name: "ნიუ-იორკი", country: "აშშ", latitude: 40.7128, longitude: -74.006 },
];

const num = (value) => (value == null ? "—" : Math.round(value));
function weather(code, day = 1) {
  if (code === 0) return [day ? "☀️" : "🌙", day ? "მზიანი" : "მოწმენდილი"];
  if (code <= 2) return ["🌤️", "ნაწილობრივ ღრუბლიანი"];
  if (code === 3) return ["☁️", "ღრუბლიანი"];
  if (code <= 48) return ["🌫️", "ნისლი"];
  if (code <= 67) return ["🌧️", "წვიმა"];
  if (code <= 77) return ["🌨️", "თოვლი"];
  if (code <= 82) return ["🌦️", "ხანმოკლე წვიმა"];
  if (code <= 86) return ["🌨️", "თოვლი"];
  return ["⛈️", "ჭექა-ქუხილი"];
}
async function getJSON(url, signal) {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error("API " + r.status);
  return r.json();
}
function forecastURL(p) {
  return (
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: p.latitude,
      longitude: p.longitude,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure",
      hourly: "precipitation_probability",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
      timezone: "auto",
      forecast_days: 6,
    })
  );
}

const suggestedCities = [
  ...places.slice(1),
  {
    name: "ბათუმი",
    country: "საქართველო",
    latitude: 41.6461,
    longitude: 41.6405,
  },
  {
    name: "ქუთაისი",
    country: "საქართველო",
    latitude: 42.2679,
    longitude: 42.6946,
  },
  {
    name: "პარიზი",
    country: "საფრანგეთი",
    latitude: 48.8566,
    longitude: 2.3522,
  },
  { name: "ბერლინი", country: "გერმანია", latitude: 52.52, longitude: 13.405 },
  { name: "რომი", country: "იტალია", latitude: 41.9028, longitude: 12.4964 },
  {
    name: "სტამბოლი",
    country: "თურქეთი",
    latitude: 41.0082,
    longitude: 28.9784,
  },
  {
    name: "ბარსელონა",
    country: "ესპანეთი",
    latitude: 41.3874,
    longitude: 2.1686,
  },
  {
    name: "დუბაი",
    country: "არაბთა გაერთიანებული საამიროები",
    latitude: 25.2048,
    longitude: 55.2708,
  },
  {
    name: "სიდნეი",
    country: "ავსტრალია",
    latitude: -33.8688,
    longitude: 151.2093,
  },
];
const cityKey = (p) =>
  `${Number(p.latitude).toFixed(2)},${Number(p.longitude).toFixed(2)}`;

async function resolveLocationName(latitude, longitude) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const data = await getJSON(
      "https://api.bigdatacloud.net/data/reverse-geocode-client?" +
        new URLSearchParams({ latitude, longitude, localityLanguage: "ka" }),
      controller.signal,
    );
    const name = [data.city, data.locality, data.principalSubdivision].find(
      (value) => typeof value === "string" && value.trim(),
    );
    return name
      ? {
          name: name.trim(),
          country: typeof data.countryName === "string" ? data.countryName : "",
        }
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export {
  places,
  suggestedCities,
  num,
  weather,
  getJSON,
  forecastURL,
  cityKey,
  resolveLocationName,
};
