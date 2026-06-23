// Zones du Cameroun pour estimation de livraison
type Zone = 'LITTORAL' | 'CENTRE' | 'OUEST' | 'NORD' | 'SUD' | 'EST' | 'INTERNATIONAL';

const CITY_TO_ZONE: Record<string, Zone> = {
  // Littoral
  'douala': 'LITTORAL',
  'nkongsamba': 'LITTORAL',
  'edea': 'LITTORAL',
  'loum': 'LITTORAL',
  'manjo': 'LITTORAL',
  'mbanga': 'LITTORAL',
  'limbe': 'LITTORAL',
  'buea': 'LITTORAL',
  'kumba': 'LITTORAL',
  'tiko': 'LITTORAL',
  // Centre
  'yaounde': 'CENTRE',
  'mbalmayo': 'CENTRE',
  'obala': 'CENTRE',
  'eseka': 'CENTRE',
  'akonolinga': 'CENTRE',
  // Ouest
  'bafoussam': 'OUEST',
  'dschang': 'OUEST',
  'mbouda': 'OUEST',
  'foumban': 'OUEST',
  'bandjoun': 'OUEST',
  'bafang': 'OUEST',
  'bamenda': 'OUEST',
  'kumbo': 'OUEST',
  'wum': 'OUEST',
  // Nord
  'garoua': 'NORD',
  'maroua': 'NORD',
  'ngaoundere': 'NORD',
  'kousseri': 'NORD',
  'mokolo': 'NORD',
  'guider': 'NORD',
  // Sud
  'ebolowa': 'SUD',
  'kribi': 'SUD',
  'sangmelima': 'SUD',
  'campo': 'SUD',
  // Est
  'bertoua': 'EST',
  'batouri': 'EST',
  'yokadouma': 'EST',
  'abong-mbang': 'EST',
};

function getZone(city: string, country: string): Zone {
  if (country && country !== 'CM' && country !== 'Cameroun') return 'INTERNATIONAL';
  const normalized = city?.toLowerCase().trim() || '';
  return CITY_TO_ZONE[normalized] || 'CENTRE'; // default to CENTRE
}

export interface ShippingRate {
  standardDays: string;   // e.g. "1-2 jours"
  expressDays: string;    // e.g. "Meme jour"
  standardFee: number;    // FCFA
  expressFee: number;     // FCFA
  label: string;          // e.g. "Livraison locale" or "Intercite"
}

// Matrix: [sellerZone][buyerZone] => ShippingRate
export function estimateShipping(sellerCity: string, sellerCountry: string, buyerCity: string, buyerCountry: string): ShippingRate {
  const sellerZone = getZone(sellerCity, sellerCountry);
  const buyerZone = getZone(buyerCity, buyerCountry);

  // International
  if (sellerZone === 'INTERNATIONAL' || buyerZone === 'INTERNATIONAL') {
    return {
      standardDays: '15-25 jours',
      expressDays: '7-12 jours',
      standardFee: 5000,
      expressFee: 12000,
      label: 'Livraison internationale',
    };
  }

  // Same zone
  if (sellerZone === buyerZone) {
    // Same city check
    const sameCity = sellerCity?.toLowerCase().trim() === buyerCity?.toLowerCase().trim();
    if (sameCity) {
      return {
        standardDays: '1-2 jours',
        expressDays: 'Meme jour',
        standardFee: 1000,
        expressFee: 2500,
        label: 'Livraison locale',
      };
    }
    return {
      standardDays: '1-2 jours',
      expressDays: '1 jour',
      standardFee: 1500,
      expressFee: 3000,
      label: 'Livraison locale',
    };
  }

  // Adjacent zones
  const adjacent: Record<string, string[]> = {
    'LITTORAL': ['CENTRE', 'OUEST', 'SUD'],
    'CENTRE': ['LITTORAL', 'OUEST', 'SUD', 'EST'],
    'OUEST': ['LITTORAL', 'CENTRE'],
    'SUD': ['CENTRE', 'LITTORAL'],
    'EST': ['CENTRE'],
    'NORD': [],
  };

  if (adjacent[sellerZone]?.includes(buyerZone) || adjacent[buyerZone]?.includes(sellerZone)) {
    return {
      standardDays: '1-2 jours',
      expressDays: '1 jour',
      standardFee: 2000,
      expressFee: 4000,
      label: 'Livraison intercite',
    };
  }

  // Far zones (anything involving NORD, or EST <-> OUEST etc.)
  return {
    standardDays: '2-3 jours',
    expressDays: '1-2 jours',
    standardFee: 3500,
    expressFee: 7000,
    label: 'Livraison longue distance',
  };
}
