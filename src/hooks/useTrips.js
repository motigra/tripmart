// Auto-discovers every trip JSON file at build/dev time — drop a new file in
// ./trips and it shows up (dev server hot-reloads on new/removed matches).
const modules = import.meta.glob('../../trips/*.json', { eager: true });

const allTrips = Object.entries(modules)
  .map(([path, mod]) => {
    const slug = path.split('/').pop().replace(/\.json$/, '');
    return { slug, data: mod.default ?? mod };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

export function useTrips() {
  return allTrips;
}

export function useTrip(slug) {
  return allTrips.find((t) => t.slug === slug) || null;
}
