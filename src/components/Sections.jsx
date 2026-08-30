import HighlightGrid from './HighlightGrid.jsx';
import RouteMap from './RouteMap.jsx';
import { factRows, itineraryDayLabel, placeCount, computeMapRoute } from '../lib/tripHelpers.js';

function Eyebrow({ index, label, dark }) {
  return (
    <div className={dark ? 'eyebrow eyebrow--dark' : 'eyebrow'}>
      {String(index + 1).padStart(2, '0')} / {label}
    </div>
  );
}

// Per-destination heading and intro come from the trip's `sections` object.
// When a heading is missing we fall back to the plain section name rather than
// to any particular destination's phrasing.
function SectionHeader({ index, eyebrow, fallbackHeading, copy = {}, count, dark }) {
  return (
    <div className={dark ? 'slide-section-header slide-section-header--dark' : 'slide-section-header'}>
      <div className="slide-section-headings">
        <Eyebrow index={index} label={eyebrow} dark={dark} />
        <h2>{copy.heading || fallbackHeading}</h2>
        {copy.intro && <p className="section-intro">{copy.intro}</p>}
      </div>
      <div className={dark ? 'count-label count-label--dark' : 'count-label'}>{count}</div>
    </div>
  );
}

export function HeroSection({ index, data, facts, headline, subhead, stops }) {
  const heroUrl = data.heroImage?.url;
  const heroCredit = (data.heroImage?.caption || '').toUpperCase();
  return (
    <section className="slide slide-hero" data-sec={index}>
      {heroUrl && <img className="slide-hero-bg" src={heroUrl} alt={data.heroImage?.caption || ''} />}
      <div className="slide-hero-scrim" />
      <div className="slide-hero-content">
        <div className="slide-hero-top">
          <div className="dest-name">{(data.destination || '').toUpperCase()}</div>
          <h1>{headline}</h1>
          <p>{subhead}</p>
        </div>
        <div className="slide-hero-stats">
          <div>
            <div className="stat-label">LENGTH</div>
            <div>{facts.recommendedDurationDays} DAYS</div>
          </div>
          <div className="stat-truncate">
            <div className="stat-label">WHEN</div>
            <div title={facts.bestSeason}>{(facts.bestSeason || '').split('—')[0].trim().toUpperCase()}</div>
          </div>
          <div>
            <div className="stat-label">STOPS</div>
            <div>{stops.length}</div>
          </div>
          <div className="stat-truncate">
            <div className="stat-label">VIBE</div>
            <div title={data.vibe}>{(data.vibe || '').toUpperCase()}</div>
          </div>
          <div className="slide-hero-credit">
            {heroCredit}
            <br />
            SCROLL ↓
          </div>
        </div>
      </div>
    </section>
  );
}

export function IdeaSection({ index, data, facts, primary }) {
  const ideaImage = data.ideaImage?.url || (primary[1] || primary[0] || {}).image;
  const ideaCaption = data.ideaImage?.caption;
  return (
    <section className="slide slide-idea" data-sec={index}>
      <div className="slide-idea-text">
        <Eyebrow index={index} label="THE IDEA" />
        <h2>{data.destination}</h2>
        <p className="brief">{data.brief}</p>
        <div className="facts-grid">
          {factRows(facts).map((row) => (
            <div className="facts-row" key={row.key}>
              <span className="facts-label">{row.label}</span>
              <span className="facts-value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="slide-idea-media">
        {ideaImage && <img src={ideaImage} alt={ideaCaption || ''} loading="lazy" />}
        {ideaCaption && <div className="slide-idea-caption">{ideaCaption}</div>}
      </div>
    </section>
  );
}

export function RouteSection({ index, data, stops }) {
  const route = computeMapRoute(data.itinerary);
  return (
    <section className="slide slide-route" data-sec={index}>
      <div className="slide-route-list">
        <Eyebrow index={index} label="THE ROUTE" />
        <h2>
          {stops.length} stops, {data.facts?.recommendedDurationDays} days
        </h2>
        <ol className="timeline">
          {(data.itinerary || []).map((leg, i) => (
            <li key={i}>
              <span className="timeline-days">{itineraryDayLabel(leg)}</span>
              <span className="timeline-content">
                <span className="timeline-location">{leg.location}</span>
                <span className="timeline-desc">{leg.description}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="slide-route-map">
        <div className="map-note">ROUTE MAP · {stops.length} STOPS</div>
        {route.markers.length > 0 ? (
          <RouteMap points={route.points} markers={route.markers} theme={data.theme} />
        ) : (
          <div className="map-placeholder">Map coming soon</div>
        )}
      </div>
    </section>
  );
}

export function PrimarySection({ index, items, copy }) {
  return (
    <section className="slide slide-primary" data-sec={index}>
      <SectionHeader
        index={index}
        eyebrow="THE BIG THREE"
        fallbackHeading="Highlights"
        copy={copy}
        count={placeCount(items.length)}
        dark={false}
      />
      <HighlightGrid items={items} variant="primary" />
    </section>
  );
}

export function NatureSection({ index, items, copy }) {
  return (
    <section className="slide slide-nature" data-sec={index}>
      <SectionHeader
        index={index}
        eyebrow="NATURE"
        fallbackHeading="Nature"
        copy={copy}
        count={placeCount(items.length)}
        dark={true}
      />
      <HighlightGrid items={items} variant="nature" />
    </section>
  );
}

export function CitiesSection({ index, items, copy }) {
  return (
    <section className="slide slide-cities" data-sec={index}>
      <SectionHeader
        index={index}
        eyebrow="CITIES & TOWNS"
        fallbackHeading="Cities & Towns"
        copy={copy}
        count={placeCount(items.length)}
        dark={false}
      />
      <HighlightGrid items={items} variant="cities" />
    </section>
  );
}

export function FoodSection({ index, items, copy }) {
  return (
    <section className="slide slide-food" data-sec={index}>
      <SectionHeader
        index={index}
        eyebrow="WHAT YOU'LL EAT"
        fallbackHeading="Food"
        copy={copy}
        count={placeCount(items.length)}
        dark={false}
      />
      <HighlightGrid items={items} variant="food" />
    </section>
  );
}

export function ThingsToDoSection({ index, items, copy }) {
  return (
    <section className="slide slide-todo" data-sec={index}>
      <SectionHeader
        index={index}
        eyebrow="THINGS TO DO"
        fallbackHeading="Things to Do"
        copy={copy}
        count={items.length === 1 ? '1 THING' : `${items.length} THINGS`}
        dark={false}
      />
      <HighlightGrid items={items} variant="todo" />
    </section>
  );
}

export function WhySection({ index, perks, copy, onHome }) {
  return (
    <section className="slide slide-why" data-sec={index}>
      <SectionHeader
        index={index}
        eyebrow="WHY IT WORKS FOR US"
        fallbackHeading="Why It Works"
        copy={copy}
        count={`${perks.length} REASONS`}
        dark
      />
      <div className="perk-grid" data-grid={perks.length}>
        {perks.map((perk) => (
          <div className="perk-item" key={perk.num} data-reveal="">
            <span className="perk-num">{perk.num}</span>
            <span>{perk.text}</span>
          </div>
        ))}
      </div>
      <div className="back-cta" onClick={onHome}>
        ← BACK TO ALL TRIPS
      </div>
    </section>
  );
}
