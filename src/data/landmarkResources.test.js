import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeWeatherCode,
  findCommonsPhoto,
  findWikipediaHistory,
  getLandmarkWeather,
  weatherAdvice,
} from './landmarkResources.js';
import { translations } from './translations.js';

test('Commons photo search requires a matching landmark and returns attribution metadata', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({
    query: {
      pages: {
        1: {
          title: 'File:Unrelated fort.jpg',
          imageinfo: [{
            thumburl: 'https://upload.wikimedia.org/fort.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Unrelated_fort.jpg',
            extmetadata: { LicenseShortName: { value: 'CC BY 4.0' } },
          }],
        },
        2: {
          title: 'File:Test Fort Maharashtra.jpg',
          imageinfo: [{
            thumburl: 'https://upload.wikimedia.org/test-fort.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Test_Fort_Maharashtra.jpg',
            extmetadata: {
              ObjectName: { value: 'Test Fort Maharashtra' },
              Artist: { value: '<a href="/wiki/User:Photographer">Photographer</a>' },
              LicenseShortName: { value: 'CC BY 4.0' },
              LicenseUrl: { value: 'http://creativecommons.org/licenses/by/4.0' },
            },
          }],
        },
      },
    },
  }), { status: 200 });

  const photo = await findCommonsPhoto({ name: 'Test Fort' });
  assert.equal(photo.title, 'Test Fort Maharashtra.jpg');
  assert.equal(photo.artist, 'Photographer');
  assert.equal(photo.license, 'CC BY 4.0');
  assert.equal(photo.licenseUrl, 'https://creativecommons.org/licenses/by/4.0');
});

test('weather guidance uses forecast precipitation, wind, and translated WMO codes', () => {
  assert.equal(describeWeatherCode(0, translations.en), translations.en.weatherClear);
  assert.equal(describeWeatherCode(95, translations.en), translations.en.weatherThunderstorm);
  assert.equal(weatherAdvice({
    weather_code: 3,
    precipitation_probability_max: 75,
    wind_speed_10m_max: 12,
  }, translations.en), translations.en.weatherHighRisk);
  assert.equal(weatherAdvice({
    weather_code: 3,
    precipitation_probability_max: 5,
    wind_speed_10m_max: 32,
  }, translations.en), translations.en.weatherCaution);
});

test('history lookup only returns an exact title match with a Wikipedia source', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({
    query: {
      pages: {
        1: { title: 'Rajgad Fort', extract: 'A historical hill fort in Maharashtra.', fullurl: 'https://en.wikipedia.org/wiki/Rajgad_Fort' },
        2: { title: 'Rajgad Road', extract: 'An unrelated road.', fullurl: 'https://en.wikipedia.org/wiki/Rajgad_Road' },
      },
    },
  }), { status: 200 });

  const history = await findWikipediaHistory({
    id: 'test-rajgad-history',
    name: 'Rajgad',
    coordinates: [18.2, 73.6],
    feature: { wikipedia: 'en:Rajgad_Fort' },
  }, 'en');
  assert.equal(history.title, 'Rajgad Fort');
  assert.match(history.extract, /historical hill fort/);
  assert.equal(history.url, 'https://en.wikipedia.org/wiki/Rajgad_Fort');

  globalThis.fetch = async () => new Response(JSON.stringify({
    query: { pages: { 3: { title: 'Rajgad Road', extract: 'An unrelated road.', fullurl: 'https://en.wikipedia.org/wiki/Rajgad_Road' } } },
  }), { status: 200 });
  const noMatch = await findWikipediaHistory({
    id: 'test-unmatched-history',
    name: 'Example Bastion',
    coordinates: [18.2, 73.6],
  }, 'en');
  assert.equal(noMatch, null);
});

test('every locale provides complete trek toolkit copy and checklist', () => {
  const keys = [
    'trekToolkit', 'toolkitTitle', 'toolkitIntro', 'toolkitLoading', 'fortHistory', 'historyLoading', 'historyUnavailable', 'historyError', 'historySource', 'searchHistory', 'photoLoading',
    'photoFailed', 'photoUnavailable', 'photoLicense', 'photoCommonsSource', 'photoLicenseText',
    'searchCommons', 'liveWeather', 'weatherLoading', 'weatherUnavailable', 'weatherForecast',
    'weatherUpdated', 'trekDate', 'weatherTemperature', 'weatherRainChance', 'weatherWind',
    'weatherHighRisk', 'weatherCaution', 'weatherCheckLocally', 'weatherError', 'tryAgain',
    'weatherDisclaimer', 'weatherSource', 'routePlanning',
    'planYourApproach', 'routeDirectoryDisclaimer', 'searchHikingRoutes', 'searchTrailhead',
    'villageServices', 'findNearbyServices', 'servicesNotVerified', 'serviceFood', 'serviceStay',
    'serviceTransport', 'serviceParking', 'serviceMedical', 'accessConditions',
    'verifyBeforeTravel', 'accessDisclaimer', 'searchLatestAccess', 'contactLocalAuthority',
    'preparationChecklist', 'beforeYouGo', 'planningDisclaimer',
    'weatherClear', 'weatherCloudy', 'weatherFog', 'weatherDrizzle',
    'weatherRain', 'weatherSnow', 'weatherShowers', 'weatherThunderstorm',
  ];
  for (const [locale, copy] of Object.entries(translations)) {
    for (const key of keys) assert.ok(copy[key], `${locale}.${key} is missing`);
    assert.equal(copy.checklistItems.split('|').length, 6, `${locale} needs six preparation steps`);
  }
});
