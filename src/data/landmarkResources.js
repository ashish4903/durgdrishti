const commonsApi = 'https://commons.wikimedia.org/w/api.php';
const weatherApi = 'https://api.open-meteo.com/v1/forecast';
const weatherCache = new Map();
const photoCache = new Map();
const historyCache = new Map();

function stripHtml(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedName(value) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isSafeHttpsUrl(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.includes(url.hostname);
  } catch {
    return false;
  }
}

function photoMatchesLocation(page, locationNames) {
  const metadata = page.imageinfo?.[0]?.extmetadata ?? {};
  const searchableText = normalizedName([
    page.title,
    metadata.ObjectName?.value,
    metadata.ImageDescription?.value,
    metadata.Categories?.value,
  ].join(' '));
  return locationNames.some((name) => {
    const tokens = normalizedName(name).split(' ').filter((token) => (
      token.length > 2 && !['fort', 'fortress', 'castle', 'hill', 'maharashtra', 'india'].includes(token)
    ));
    return tokens.length > 0 && tokens.every((token) => searchableText.includes(token));
  });
}

function toCommonsPhoto(page, locationNames) {
  if (!photoMatchesLocation(page, locationNames)) return null;
  const info = page.imageinfo?.[0];
  const metadata = info?.extmetadata ?? {};
  const license = stripHtml(metadata.LicenseShortName?.value);
  if (!info?.thumburl || !license || /non.?commercial|no.?derivatives/i.test(license)) return null;
  if (!isSafeHttpsUrl(info.thumburl, ['upload.wikimedia.org', 'thumb.wikimedia.org'])) return null;
  if (!isSafeHttpsUrl(info.descriptionurl, ['commons.wikimedia.org'])) return null;

  const licenseUrl = metadata.LicenseUrl?.value?.replace(/^http:/, 'https:');
  return {
    title: page.title.replace(/^File:/, ''),
    imageUrl: info.thumburl,
    pageUrl: info.descriptionurl,
    artist: stripHtml(metadata.Artist?.value) || null,
    license,
    licenseUrl: isSafeHttpsUrl(licenseUrl, ['creativecommons.org', 'www.gnu.org']) ? licenseUrl : null,
  };
}

export async function findCommonsPhoto(location, signal) {
  const locationNames = [...new Set([location.name, ...(location.feature?.names ?? [])].filter(Boolean))];
  const cacheKey = locationNames[0];
  if (photoCache.has(cacheKey)) return photoCache.get(cacheKey);

  const query = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${locationNames.slice(0, 3).join(' OR ')} fort Maharashtra`,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1000',
    format: 'json',
    origin: '*',
  });
  const response = await fetch(`${commonsApi}?${query}`, { signal });
  if (!response.ok) throw new Error(`Wikimedia Commons returned HTTP ${response.status}`);
  const data = await response.json();
  const pages = Object.values(data.query?.pages ?? {});
  const photo = pages.map((page) => toCommonsPhoto(page, locationNames)).find(Boolean) ?? null;
  photoCache.set(cacheKey, photo);
  return photo;
}

function normalizedArticleName(value = '') {
  return value.toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu, '');
}

function matchesArticleTitle(title, locationNames) {
  const normalizedTitle = normalizedArticleName(title).replace(/(fort|fortress|castle)$/i, '');
  return locationNames.some((name) => {
    const normalizedName = normalizedArticleName(name).replace(/(fort|fortress|castle)$/i, '');
    return normalizedName.length > 2 && normalizedTitle === normalizedName;
  });
}

export async function findWikipediaHistory(location, language = 'en', signal) {
  const locationNames = [...new Set([location.name, ...(location.feature?.names ?? [])].filter(Boolean))];
  const cacheKey = `${language}:${locationNames[0]}`;
  if (historyCache.has(cacheKey)) return historyCache.get(cacheKey);

  const taggedArticle = location.feature?.wikipedia?.split(':');
  const wikiLanguage = ['en', 'mr', 'hi'].includes(taggedArticle?.[0]) ? taggedArticle[0] : language;
  const query = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: taggedArticle?.[1] ?? `${locationNames.slice(0, 3).join(' OR ')} Maharashtra fort`,
    gsrnamespace: '0',
    gsrlimit: '8',
    prop: 'extracts|info',
    exintro: '1',
    explaintext: '1',
    inprop: 'url',
    format: 'json',
    origin: '*',
  });
  const response = await fetch(`https://${wikiLanguage}.wikipedia.org/w/api.php?${query}`, { signal });
  if (!response.ok) throw new Error(`Wikipedia returned HTTP ${response.status}`);
  const data = await response.json();
  const article = Object.values(data.query?.pages ?? {}).find((page) => (
    page.extract && matchesArticleTitle(page.title, locationNames)
  ));
  if (!article) {
    historyCache.set(cacheKey, null);
    return null;
  }
  const url = article.fullurl;
  if (!isSafeHttpsUrl(url, [`${wikiLanguage}.wikipedia.org`])) {
    throw new Error('Wikipedia returned an invalid article URL.');
  }
  const history = {
    title: article.title,
    extract: article.extract.trim(),
    url,
    language: wikiLanguage,
  };
  historyCache.set(cacheKey, history);
  return history;
}

export async function getLandmarkWeather(coordinates, signal) {
  const [latitude, longitude] = coordinates;
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < 15 * 60 * 1000) return cached.data;

  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'Asia/Kolkata',
    forecast_days: '7',
  });
  const response = await fetch(`${weatherApi}?${query}`, { signal });
  if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`);
  const data = await response.json();
  if (!data.current || !data.daily?.time?.length) {
    throw new Error('Weather provider returned an incomplete forecast.');
  }
  weatherCache.set(cacheKey, { data, fetchedAt: Date.now() });
  return data;
}

export function describeWeatherCode(code, copy) {
  if (code === 0) return copy.weatherClear;
  if (code <= 3) return copy.weatherCloudy;
  if (code <= 48) return copy.weatherFog;
  if (code <= 57) return copy.weatherDrizzle;
  if (code <= 67) return copy.weatherRain;
  if (code <= 77) return copy.weatherSnow;
  if (code <= 82) return copy.weatherShowers;
  if (code <= 86) return copy.weatherSnow;
  return copy.weatherThunderstorm;
}

export function weatherAdvice(day, copy) {
  if (day.weather_code >= 95 || day.precipitation_probability_max >= 70 || day.wind_speed_10m_max >= 45) {
    return copy.weatherHighRisk;
  }
  if (day.weather_code >= 51 || day.precipitation_probability_max >= 35 || day.wind_speed_10m_max >= 30) {
    return copy.weatherCaution;
  }
  return copy.weatherCheckLocally;
}
