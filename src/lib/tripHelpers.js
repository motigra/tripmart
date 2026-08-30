export const FACT_LABELS = {
  recommendedDurationDays: 'LENGTH',
  flexibleRangeDays: 'FLEX',
  bestSeason: 'SEASON',
  currency: 'MONEY',
  language: 'LANGUAGE',
  timezone: 'TIME',
  arrivalAirport: 'IN',
  departureAirport: 'OUT',
  driving: 'DRIVING',
  flightsWithinTrip: 'FLIGHTS',
  familyNote: 'FAMILY',
};

export function factRows(facts = {}) {
  return Object.keys(facts).map((k) => ({
    key: k,
    label: FACT_LABELS[k] || k.toUpperCase(),
    value: k === 'recommendedDurationDays' ? `${facts[k]} days` : facts[k],
  }));
}

export function splitTitle(title = '', fallback = '') {
  const parts = String(title).split(':');
  return {
    headline: parts[0],
    subhead: (parts[1] || '').trim() || fallback,
  };
}

// Merges consecutive itinerary legs that share the same base location name
// into a single "stop" (e.g. arrival day + the following city days).
export function computeStops(itinerary = []) {
  const out = [];
  itinerary.forEach((leg) => {
    const name = String(leg.location).replace(/\s*\(.*\)$/, '').split(' → ')[0];
    const nums = String(leg.days).split('-').map(Number);
    const prev = out[out.length - 1];
    if (prev && prev.name.split(' ')[0] === name.split(' ')[0]) {
      prev.name = name;
      prev.last = nums[nums.length - 1];
      return;
    }
    out.push({ name, first: nums[0], last: nums[nums.length - 1] });
  });
  out.forEach((s) => {
    s.daysLabel = s.first === s.last ? `Day ${s.first}` : `Days ${s.first}–${s.last}`;
  });
  return out;
}

export function itineraryDayLabel(leg) {
  const days = String(leg.days);
  return days.indexOf('-') > -1 ? `Days ${days.replace('-', '–')}` : `Day ${days}`;
}

export function placeCount(n) {
  return `${n} ${n === 1 ? 'PLACE' : 'PLACES'}`;
}

export function numberedPerks(perks = []) {
  return perks.map((p, i) => ({ num: String(i + 1).padStart(2, '0'), text: p }));
}

// Geometry for the route map. Legs whose location starts with "Departure" are kept
// in the line (so a loop closes back on itself) but get no pin — they are not stops.
export function computeMapRoute(itinerary = []) {
  const withCoords = itinerary.filter(
    (l) => typeof l.lat === 'number' && typeof l.lon === 'number'
  );
  if (withCoords.length === 0) return { points: [], markers: [] };

  const points = [];
  withCoords.forEach((leg) => {
    const prev = points[points.length - 1];
    if (prev && prev.lat === leg.lat && prev.lon === leg.lon) return; // same place twice running
    points.push({ lat: leg.lat, lon: leg.lon, name: leg.location, leg });
  });

  const markers = [];
  points.forEach((p) => {
    if (/^departure\b/i.test(p.name)) return;
    const name = String(p.name).replace(/\s*\(.*\)$/, '');
    const prev = markers[markers.length - 1];
    if (prev && prev.name.split(' ')[0] === name.split(' ')[0]) {
      prev.name = name; // arrival night + the city itself are one pin
      return;
    }
    markers.push({ lat: p.lat, lon: p.lon, name });
  });
  return { points, markers };
}
