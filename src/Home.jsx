import { useState } from 'react';
import HomeMap from './components/HomeMap.jsx';

export default function Home({ trips }) {
  const [hoveredSlug, setHoveredSlug] = useState(null);

  return (
    <div className="home">
      <header className="home-header">
        <span>TRIPMART — DESTINATIONS</span>
        <span>{trips.length} DESTINATIONS</span>
      </header>
      <div className="home-intro">
        <h1>Vacation Options 2026</h1>
        <p className="home-intro-text">
          Each page is a self-contained pitch for one trip option. Start with whichever catches your eye first.
          Every trip is scoped for the same autumn 2026 window, and day counts are an approximation, not fixed.
        </p>
      </div>
      <div className="home-grid">
        {trips.map(({ slug, data }) => {
          const facts = data.facts || {};
          return (
            <a
              key={slug}
              className="trip-card"
              href={`#/${slug}`}
              onMouseEnter={() => setHoveredSlug(slug)}
              onMouseLeave={() => setHoveredSlug((s) => (s === slug ? null : s))}
            >
              <div className="trip-card-media">
                {data.heroImage?.url && (
                  <img src={data.heroImage.url} alt={data.destination} loading="lazy" />
                )}
                {facts.recommendedDurationDays && (
                  <span className="trip-card-days">{facts.recommendedDurationDays} DAYS</span>
                )}
              </div>
              <div className="trip-card-body">
                <h2>{data.destination}</h2>
                <div className="trip-card-footer">
                  <span className="trip-card-vibe" title={data.vibe}>
                    {(data.vibe || '').toUpperCase()}
                  </span>
                  <span>OPEN →</span>
                </div>
              </div>
            </a>
          );
        })}
        <HomeMap trips={trips} hoveredSlug={hoveredSlug} />
      </div>
    </div>
  );
}
