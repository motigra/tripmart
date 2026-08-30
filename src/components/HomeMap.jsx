import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { computeMapRoute } from '../lib/tripHelpers.js';

// The collection spans the whole globe (Korea to the Rockies to the Azores),
// so fitting every destination into view at once forces a near-world zoom
// with the pins lost in it. The default view is just a starting point, not
// a "see everything" requirement — it centers on the collection's own
// average location at a fixed zoom close enough to actually fill the panel.
const OVERVIEW_ZOOM = 4;

// Andrew's monotone chain, over [lon, lat] pairs so the cross product is a
// plain 2D orientation test. Returns the hull as {lat, lon} points, or fewer
// than 3 points if the input is collinear (e.g. a route that runs in a
// near-straight line) — callers fall back to a line in that case.
function convexHull(points) {
  const pts = points
    .map((p) => [p.lon, p.lat])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return points;

  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list) => {
    const hull = [];
    for (const p of list) {
      while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) hull.pop();
      hull.push(p);
    }
    hull.pop();
    return hull;
  };
  const lower = build(pts);
  const upper = build(pts.slice().reverse());
  return lower.concat(upper).map(([lon, lat]) => ({ lat, lon }));
}

/**
 * A single passive map for the home page: one dot per destination by default,
 * fitted to show them all. Hovering a trip card (via `hoveredSlug`) flies the
 * map to that trip's own footprint and highlights it as a filled polygon
 * (the internal stop-by-stop pins are redundant at this zoomed-out scale).
 * The map itself takes no input — the card grid is the only way to navigate.
 */
export default function HomeMap({ trips, hoveredSlug }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const idleLayerRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const routesRef = useRef({});
  const overviewViewRef = useRef(null);

  useEffect(() => {
    const routes = {};
    trips.forEach(({ slug, data }) => {
      const { points, markers } = computeMapRoute(data.itinerary);
      if (markers.length === 0) return;
      const lats = markers.map((m) => m.lat);
      const lons = markers.map((m) => m.lon);
      routes[slug] = {
        points,
        markers,
        accent: data.theme?.accent || '#a39b8b',
        centroid: {
          lat: lats.reduce((a, b) => a + b, 0) / lats.length,
          lon: lons.reduce((a, b) => a + b, 0) / lons.length,
        },
      };
    });
    routesRef.current = routes;

    const el = elRef.current;
    if (!el || Object.keys(routes).length === 0) return;

    const map = L.map(el, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      fadeAnimation: false,
    });
    mapRef.current = map;

    // Esri's World Street Map, not the plain OSM tile set used on the per-trip
    // route map: it labels places in English/romanized script everywhere
    // (Seoul, not 서울), which the plain OSM style doesn't. No API key needed.
    // (Wikimedia's "osm-intl" style does the same name:en preference, but its
    // public tile endpoint 403s above zoom 7 for non-Wikimedia traffic — too
    // coarse to be usable here.) Note the path order is z/y/x, not z/x/y.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution:
        'Tiles &copy; Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom',
    }).addTo(map);

    const idleLayer = L.layerGroup().addTo(map);
    idleLayerRef.current = idleLayer;
    Object.values(routes).forEach((r) => {
      L.circleMarker([r.centroid.lat, r.centroid.lon], {
        radius: 6,
        color: r.accent,
        weight: 2,
        fillColor: r.accent,
        fillOpacity: 0.85,
      }).addTo(idleLayer);
    });

    highlightLayerRef.current = L.layerGroup().addTo(map);

    const centroids = Object.values(routes).map((r) => r.centroid);
    const overviewCenter = {
      lat: centroids.reduce((a, c) => a + c.lat, 0) / centroids.length,
      lon: centroids.reduce((a, c) => a + c.lon, 0) / centroids.length,
    };
    overviewViewRef.current = overviewCenter;
    map.setView([overviewCenter.lat, overviewCenter.lon], OVERVIEW_ZOOM);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [trips]);

  useEffect(() => {
    const map = mapRef.current;
    const idleLayer = idleLayerRef.current;
    const highlightLayer = highlightLayerRef.current;
    if (!map || !idleLayer || !highlightLayer) return;

    highlightLayer.clearLayers();
    const hovered = hoveredSlug && routesRef.current[hoveredSlug];

    idleLayer.eachLayer((dot) => {
      dot.setStyle({ opacity: hovered ? 0.2 : 0.9, fillOpacity: hovered ? 0.15 : 0.85 });
    });

    if (!hovered) {
      const c = overviewViewRef.current;
      map.flyTo([c.lat, c.lon], OVERVIEW_ZOOM, { duration: 0.6 });
      return;
    }

    const { points, accent } = hovered;
    const hull = convexHull(points);
    if (hull.length >= 3) {
      L.polygon(hull.map((p) => [p.lat, p.lon]), {
        color: accent,
        weight: 2,
        opacity: 0.85,
        fillColor: accent,
        fillOpacity: 0.2,
      }).addTo(highlightLayer);
    } else if (points.length > 1) {
      // Collinear stops (a route that runs in a near-straight line) have no
      // enclosed area — fall back to a line so there's still a visible shape.
      L.polyline(points.map((p) => [p.lat, p.lon]), { color: accent, weight: 3, opacity: 0.85 }).addTo(
        highlightLayer
      );
    }

    map.flyToBounds(L.latLngBounds(points.map((p) => [p.lat, p.lon])), {
      padding: [20, 20],
      duration: 0.6,
    });
  }, [hoveredSlug]);

  return <div className="home-map" ref={elRef} aria-hidden="true" />;
}
