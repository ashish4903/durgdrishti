import { forts } from './forts.js';
import fortDirectoryData from './fortDirectoryData.json' with { type: 'json' };
import fortOsmData from './fortOsmData.json' with { type: 'json' };

const indexedNames = [
  'Ahivant Fort', 'Ahmednagar Fort', 'Ajinkyatara', 'Ajobagad Fort', 'Akluj Fort',
  'Akola Fort', 'Alang Fort', 'Ambolgad Fort', 'Anjaneri', 'Anjaneri Fort',
  'Anjanvel Fort', 'Ankai Fort', 'Antur Fort', 'Arnala fort', 'Asava Fort',
  'Asheri fort', 'Avandha Fort', 'Avchitgad', 'Bahadur Fort', 'Balapur Fort',
  'Ballarpur Fort', 'Bankot fort', 'Belapur Fort', 'Bhagwantgad', 'Bhairavgad',
  'Bhairavgad (fort)', 'Bhairavgad (Kothale)', 'Bhairavgad (Moroshi)',
  'Bhairavgad (Shirpunje)', 'Bhamer Dhule', 'Bharatgad', 'Bhaskargad',
  'Bhawangad Fort', 'Bhivgad Fort', 'Bhorgiri fort', 'Bhudargad',
  'Bhupatgad Fort', 'Bhushangad', 'Birwadi fort', 'Bitangad', 'Bombay Castle',
  'Castella de Aguada', 'Chanda Fort', 'Chandan Fort', 'Chandragad Fort',
  'Chandwad fort', 'Chauler Fort', 'Chavand, Maharashtra', 'Dategad',
  'Dativare fort', 'Daulatabad Fort', 'Dermal Fort', 'Devgad fort', 'Dhak Bahiri',
  'Dhawalgad', 'Dhodap', 'Dhunda fort', 'Dongri Fort', 'Dronagiri Fort',
  'Dubergad', 'Durgabhandar', 'Durgadi Fort', 'Fattegad', 'Fort George, Mumbai',
  'Fort Jadhavgadh', 'Gagangad', 'Galna Fort', 'Gambhirgad', 'Gawilghur',
  'Ghangad', 'Ghargad', 'Ghodbunder Fort', 'Ghosalegad Fort', 'Goa Fort',
  'Gondhanapur', 'Gopalgad', 'Gorakhgad', 'Gowalkot', 'Gumtara Fort', 'Hadsar',
  'Hargad Fort', 'Harihar fort', 'Harishchandragad', 'Hatgadh Fort',
  'Indori fort', 'Indrai fort', 'Irshalgad', 'Jaigad Fort', 'Jalna Fort',
  'Javji Bamble', 'Kaldurg Fort', 'Kamandurg Fort', 'Kandhar Fort',
  'Kavnai fort', 'Kharda', 'Kohoj', 'Mahipatgad', 'Mahuli', 'Mahur Fort',
  'Malanggad', 'Mangalgad', 'Mangi-Tungi', 'Manikgad', 'Manikgad (Raigad)',
  'Naldurg Fort', 'Nanded Fort', 'Nhavigad', 'Panhala Fort', 'Paranda Fort',
  'Pargad', 'Pavangad', 'Prachitgad', 'Ramsej Fort', 'Rangana Fort', 'Ratangad',
  'Salher', 'Samangad', 'Songir', 'Suamargad', 'Suvarnadurg', 'Thalner',
  'Tipagad (Gadchiroli)', 'Udgir Fort', 'Vairagad Fort', 'Vishalgad',
  'Yashwantgad Fort', 'Yeshwantgad', 'Kunjargad', 'Pabargad', 'Laling Fort',
  'Mahipalgad', 'Shivgad', 'Vallabhgad Fort', 'Achala Fort', 'Bhavangad Fort',
  'Chakan Fort', 'Purandar Fort', 'Rohida Fort', 'Shivneri Fort', 'Tikona Fort',
  'Tung Fort', 'Rajmachi Fort', 'Sajjangad', 'Vasota Fort', 'Karnala Fort',
  'Sewri Fort', 'Worli Fort', 'Mahim Fort', 'Vijaydurg Fort', 'Khanderi',
];

const coordinatesByName = {
  'Ahmednagar Fort': [19.09480556, 74.75547222],
  Ajinkyatara: [17.67236111, 73.99538889],
  'Akola Fort': [20.706225, 76.990019],
  'Ankai Fort': [20.18722222, 74.44763889],
  Avchitgad: [18.47411111, 73.11863889],
  'Balapur Fort': [20.670309, 76.7737],
  Bhudargad: [16.235033, 74.048109],
  Bhushangad: [17.4648, 74.4063],
  'Bombay Castle': [18.93194444, 72.83777778],
  'Chavand, Maharashtra': [19.236848, 73.748217],
  'Daulatabad Fort': [19.942724, 75.213164],
  'Dhak Bahiri': [18.87488889, 73.42833333],
  Dhodap: [20.38558333, 74.03088889],
  'Dongri Fort': [19.31018333, 72.79344722],
  Gagangad: [16.5432, 73.8185],
  Gawilghur: [21.38222222, 77.33388889],
  Gorakhgad: [19.19219444, 73.54077778],
  Gowalkot: [17.54652778, 73.48780556],
  Harishchandragad: [19.388239, 73.77594],
  Irshalgad: [18.933568, 73.232031],
  Lohagad: [18.70888889, 73.47666667],
  Mulher: [20.78138889, 74.06388889],
  'Murud-Janjira': [18.299589, 72.964425],
  Pratapgad: [17.936224, 73.577607],
  'Raigad Fort': [18.2335, 73.4406],
  Rajgad: [18.2459862, 73.6821929],
  Ratangad: [19.5, 73.69],
  'Sindhudurg Fort': [16.043769, 73.461416],
};

const keyForName = (name) => name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
const curatedEntries = forts.map((fort) => ({
  id: fort.id,
  name: fort.name,
  coordinates: fort.coordinates,
  forecastId: fort.id,
}));

const additionalEntries = [
  ...indexedNames,
  'Lohagad', 'Mulher', 'Murud-Janjira', 'Pratapgad', 'Raigad Fort', 'Sindhudurg Fort',
].map((name) => ({
  id: `reference-${keyForName(name)}`,
  name,
  coordinates: coordinatesByName[name],
}));

const directoryEntries = fortDirectoryData.map(({ name, district }) => ({
  id: `directory-${keyForName(name)}`,
  name,
  district,
  source: 'trekshitiz',
}));

export const fortMapFeatures = fortOsmData.map((feature) => ({
  ...feature,
  key: `${feature.type}/${feature.id}`,
  // Prefer the ASCII (Latin-script) name; the control-character range is intended here.
  // eslint-disable-next-line no-control-regex
  name: feature.names.find((name) => /^[\x00-\x7F]*$/.test(name)) ?? feature.names[0] ?? 'Fortification',
  url: `https://www.openstreetmap.org/${feature.type}/${feature.id}`,
}));

const normalizeMapName = (name) => name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
const benchmarkNameKey = (name) => normalizeMapName(name).replace(/fort$/, '');

const osmCoordinatesByName = new Map();
for (const feature of fortMapFeatures) {
  for (const name of feature.names) {
    const key = keyForName(name);
    if (key && !osmCoordinatesByName.has(key)) {
      osmCoordinatesByName.set(key, [feature.lat, feature.lon]);
    }
  }
}

const fortEntries = [...curatedEntries, ...additionalEntries, ...directoryEntries].map((entry) => ({
  ...entry,
  coordinates: entry.coordinates ?? osmCoordinatesByName.get(keyForName(entry.name)),
}));

export const fortCatalogue = [...new Map(
  fortEntries.map((entry) => [keyForName(entry.name), entry]),
).values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));

const mappedCataloguePlaces = fortCatalogue.filter((place) => place.coordinates);
const supplementalMapPlaces = mappedCataloguePlaces.filter((place) => !fortMapFeatures.some((feature) => (
  feature.names.some((name) => normalizeMapName(name) === normalizeMapName(place.name))
)));

export const mappedTrailLocations = [
  ...fortMapFeatures.map((feature) => {
    const benchmark = forts.find((fort) => feature.names.some((name) => (
      benchmarkNameKey(name) === benchmarkNameKey(fort.name)
    )));
    return {
      id: `atlas:${feature.key}`,
      name: feature.name === 'Fortification' ? `Fortification (${feature.key})` : feature.name,
      coordinates: [feature.lat, feature.lon],
      forecastId: benchmark?.id,
      feature,
      source: 'openstreetmap',
    };
  }),
  ...supplementalMapPlaces.map((place) => ({
    id: `atlas:${place.id}`,
    name: place.name,
    coordinates: place.coordinates,
    forecastId: place.forecastId,
    source: place.source ?? 'public-index',
  })),
];

export const fortCatalogueSource = 'https://en.wikipedia.org/wiki/List_of_forts_in_Maharashtra';
export const TrekshitizFortSource = 'https://trekshitiz.com/fort_information.php';
export const UNESCOFortSource = 'https://whc.unesco.org/en/list/1739/';
export const OpenStreetMapFortSource = 'https://www.openstreetmap.org/copyright';
