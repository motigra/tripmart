import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Hops longer than this are drawn dashed, because they cannot have been driven.
// Set well above the longest real driving leg in the collection (Salt Lake City to
// Zion, 409 km) so only an actual flight dashes — currently just Lisbon to the
// Azores at 1,447 km.
const LONG_HOP_KM = 800;

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pin(n) {
  return L.divIcon({
    className: 'route-pin-wrap',
    html: `<span class="route-pin">${n}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/**
 * The trip's route on an OpenStreetMap base layer.
 *
 * Leaflet + OSM raster tiles need no API key and no billing account, so the build
 * stays static and deployable to GitHub Pages as-is. Straight lines between stops:
 * this is a frame of reference, not a navigation aid.
 *
 * `points` drives the line (includes the return leg so loops close);
 * `markers` drives the numbered pins (stops you actually sleep at).
 */
export default function RouteMap({ points = [], markers = [], theme = {} }) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || markers.length === 0) return;

    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: false, // the page is a vertical scroller — don't hijack the wheel
      // The section mounts off-screen and is resized as the page scrolls to it, which
      // interrupts Leaflet's tile fade-in and leaves tiles stuck at partial opacity.
      fadeAnimation: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const accent = theme.accent || '#1f6f78';

    // Split the line wherever the hop is too long to have been driven.
    let run = points.length ? [points[0]] : [];
    const runs = run.length ? [run] : [];
    for (let i = 1; i < points.length; i++) {
      if (haversineKm(points[i - 1], points[i]) > LONG_HOP_KM) {
        L.polyline(
          [[points[i - 1].lat, points[i - 1].lon], [points[i].lat, points[i].lon]],
          { color: accent, weight: 2, opacity: 0.55, dashArray: '4 8' }
        ).addTo(map);
        run = [points[i]];
        runs.push(run);
      } else {
        run.push(points[i]);
      }
    }
    runs.forEach((r) => {
      if (r.length > 1) {
        L.polyline(r.map((s) => [s.lat, s.lon]), {
          color: accent,
          weight: 3,
          opacity: 0.85,
        }).addTo(map);
      }
    });

    markers.forEach((m, i) => {
      L.marker([m.lat, m.lon], { icon: pin(i + 1), title: m.name })
        .addTo(map)
        .bindTooltip(`${i + 1}. ${m.name}`, { direction: 'top', offset: [0, -14] });
    });

    map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lon])), {
      padding: [40, 40],
      maxZoom: 9,
    });

    // The map sits in a flex column that only gets its height after mount.
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
    };
  }, [points, markers, theme.accent]);

  if (markers.length === 0) return null;
  return <div className="route-map" ref={elRef} style={{ '--pin': theme.accent || '#1f6f78' }} />;
}
