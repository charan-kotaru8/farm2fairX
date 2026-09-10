/**
 * Authentic geographic coordinates for Indian States & Districts.
 * Ensures the Market Discovery Map reliably displays district markers
 * for any state selected in the platform.
 */
import { districtsFor } from './indianStatesDistricts';

export const STATE_CENTERS = {
  'Andaman and Nicobar Islands': [11.74, 92.65],
  'Andhra Pradesh': [15.91, 79.74],
  'Arunachal Pradesh': [28.21, 94.72],
  'Assam': [26.20, 92.93],
  'Bihar': [25.09, 85.31],
  'Chandigarh': [30.73, 76.77],
  'Chhattisgarh': [21.27, 81.86],
  'Dadra and Nagar Haveli and Daman and Diu': [20.42, 72.83],
  'Delhi': [28.70, 77.10],
  'Goa': [15.29, 74.12],
  'Gujarat': [22.25, 71.19],
  'Haryana': [29.05, 76.08],
  'Himachal Pradesh': [31.10, 77.17],
  'Jammu and Kashmir': [33.77, 76.57],
  'Jharkhand': [23.61, 85.27],
  'Karnataka': [15.31, 75.71],
  'Kerala': [10.85, 76.27],
  'Ladakh': [34.15, 77.57],
  'Lakshadweep': [10.56, 72.64],
  'Madhya Pradesh': [22.97, 78.65],
  'Maharashtra': [19.75, 75.71],
  'Manipur': [24.66, 93.90],
  'Meghalaya': [25.46, 91.36],
  'Mizoram': [23.16, 92.93],
  'Nagaland': [26.15, 94.56],
  'Odisha': [20.95, 85.09],
  'Puducherry': [11.94, 79.80],
  'Punjab': [31.14, 75.34],
  'Rajasthan': [27.02, 74.21],
  'Sikkim': [27.53, 88.51],
  'Tamil Nadu': [11.12, 78.65],
  'Telangana': [18.11, 79.01],
  'Tripura': [23.94, 91.98],
  'Uttar Pradesh': [26.84, 80.94],
  'Uttarakhand': [30.06, 79.01],
  'West Bengal': [22.98, 87.85],
};

// Authentic coordinates for districts (normalized lowercase keys)
export const KNOWN_DISTRICT_COORDS = {
  // All 36 Maharashtra Districts
  'nagpur': [21.1458, 79.0882],
  'latur': [18.4088, 76.5604],
  'pune': [18.5089, 73.8300],
  'nashik': [19.9975, 73.7898],
  'solapur': [17.6599, 75.9064],
  'kolhapur': [16.7050, 74.2433],
  'sangli': [16.8524, 74.5815],
  'amravati': [20.9374, 77.7796],
  'aurangabad': [19.8762, 75.3433],
  'chhatrapati sambhajinagar': [19.8762, 75.3433],
  'akola': [20.7002, 77.0082],
  'nanded': [19.1383, 77.3210],
  'jalgaon': [21.0077, 75.5626],
  'ahmednagar': [19.0952, 74.7496],
  'satara': [17.6805, 74.0183],
  'beed': [18.9891, 75.7601],
  'wardha': [20.7453, 78.6022],
  'chandrapur': [19.9615, 79.2961],
  'yavatmal': [20.3888, 78.1204],
  'bhandara': [21.1714, 79.6541],
  'gondia': [21.4589, 80.1961],
  'gadchiroli': [20.1849, 79.9948],
  'buldhana': [20.5293, 76.1843],
  'washim': [20.1110, 77.1345],
  'hingoli': [19.7196, 77.1478],
  'jalna': [19.8410, 75.8864],
  'parbhani': [19.2644, 76.7767],
  'osmanabad': [18.1861, 76.0419],
  'dharashiv': [18.1861, 76.0419],
  'ratnagiri': [16.9902, 73.3120],
  'sindhudurg': [16.1216, 73.6939],
  'raigad': [18.5158, 73.1822],
  'palghar': [19.6967, 72.7699],
  'thane': [19.2183, 72.9781],
  'dhule': [20.9042, 74.7749],
  'nandurbar': [21.3739, 74.2403],
  'mumbai': [18.9220, 72.8347],
  'mumbai city': [18.9220, 72.8347],
  'mumbai suburban': [19.0760, 72.8777],

  // Karnataka
  'bengaluru urban': [13.0189, 77.5458],
  'bengaluru rural': [13.2300, 77.5800],
  'dharwad': [15.3942, 75.1245],
  'belagavi': [15.8497, 74.4977],
  'mysuru': [12.2958, 76.6394],
  'kalaburagi': [17.3297, 76.8343],
  'ballari': [15.1394, 76.9214],
  'shivamogga': [13.9299, 75.5681],
  'tumakuru': [13.3379, 77.1173],
  'mandya': [12.5244, 76.8958],

  // Gujarat
  'ahmedabad': [23.0225, 72.5714],
  'surat': [21.1959, 72.8302],
  'rajkot': [22.3486, 70.7850],
  'vadodara': [22.3072, 73.1812],
  'junagadh': [21.5222, 70.4579],
  'bhavnagar': [21.7645, 72.1519],
  'jamnagar': [22.4707, 70.0577],
  'amreli': [21.6032, 71.2221],

  // Madhya Pradesh
  'indore': [22.6865, 75.8458],
  'bhopal': [23.2599, 77.4126],
  'ujjain': [23.1765, 75.7885],
  'jabalpur': [23.1815, 79.9864],
  'gwalior': [26.2183, 78.1828],
  'neemuch': [24.4764, 74.8631],
  'mandsaur': [24.0728, 75.0694],
  'hoshangabad': [22.7519, 77.7275],

  // Punjab & Haryana
  'ludhiana': [30.7071, 76.2163],
  'amritsar': [31.6340, 74.8723],
  'jalandhar': [31.3260, 75.5762],
  'patiala': [30.3398, 76.3869],
  'bathinda': [30.2110, 74.9455],
  'karnal': [29.6857, 76.9905],
  'panipat': [29.3909, 76.9635],
  'hisar': [29.1492, 75.7217],
  'sirsa': [29.5349, 75.0296],

  // Rajasthan
  'jaipur': [26.9124, 75.7873],
  'kota': [25.1325, 75.8648],
  'jodhpur': [26.2389, 73.0243],
  'bikaner': [28.0229, 73.3119],
  'sri ganganagar': [29.9038, 73.8772],
  'alwar': [27.5530, 76.6346],

  // Telangana & Andhra Pradesh
  'hyderabad': [17.3850, 78.4867],
  'warangal': [17.9821, 79.6231],
  'khammam': [17.2473, 80.1514],
  'nizamabad': [18.6725, 78.0941],
  'guntur': [16.2917, 80.4485],
  'visakhapatnam': [17.6868, 83.2185],
  'krishna': [16.1809, 81.1303],
  'kurnool': [15.8281, 78.0373],

  // Uttar Pradesh
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'agra': [27.1767, 78.0081],
  'varanasi': [25.3176, 82.9739],
  'meerut': [28.9845, 77.7064],
  'bareilly': [28.3670, 79.4304],

  // Tamil Nadu
  'chennai': [13.0694, 80.1948],
  'coimbatore': [11.0168, 76.9558],
  'madurai': [9.9252, 78.1198],
  'salem': [11.6643, 78.1460],
  'tiruchirappalli': [10.7905, 78.7047],
};

/**
 * Returns [lat, lng] for a given district in a state.
 * If not in the known coords list, generates a deterministic geographic offset around the state centroid
 * so every district in every state always renders gracefully on the map.
 */
export function getDistrictCoordinates(state, district, index = 0, total = 1) {
  const normDist = (district || '').trim().toLowerCase();
  if (KNOWN_DISTRICT_COORDS[normDist]) {
    return KNOWN_DISTRICT_COORDS[normDist];
  }

  // Fallback to state centroid with deterministic distribution
  const stateCenter = STATE_CENTERS[state] || [19.75, 75.71];
  if (total <= 1) return stateCenter;

  // Distribute along a spiral / orbital scatter inside the state boundary (~0.4 - 1.2 degrees radius)
  const angle = (index * 2.39996); // Golden ratio angle
  const radius = 0.25 + 0.65 * Math.sqrt((index + 1) / total);
  const lat = stateCenter[0] + radius * Math.cos(angle) * 0.7;
  const lng = stateCenter[1] + radius * Math.sin(angle);
  return [Number(lat.toFixed(4)), Number(lng.toFixed(4))];
}

/**
 * Returns array of { name, lat, lng } for all districts in a state.
 */
export function getDistrictsForStateWithCoords(state) {
  const rawDistricts = districtsFor(state);
  const distList = rawDistricts.length > 0 ? rawDistricts : [state || 'Maharashtra'];
  const total = distList.length;

  return distList.map((districtName, index) => {
    const coords = getDistrictCoordinates(state, districtName, index, total);
    return {
      name: districtName,
      lat: coords[0],
      lng: coords[1],
    };
  });
}
