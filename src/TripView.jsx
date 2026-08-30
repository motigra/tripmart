import { useEffect, useMemo, useRef, useState } from 'react';
import SlideNav from './components/SlideNav.jsx';
import {
  HeroSection,
  IdeaSection,
  RouteSection,
  PrimarySection,
  NatureSection,
  CitiesSection,
  FoodSection,
  ThingsToDoSection,
  WhySection,
} from './components/Sections.jsx';
import { splitTitle, computeStops, numberedPerks } from './lib/tripHelpers.js';
import { themeVars } from './lib/theme.js';

function goHome() {
  location.hash = '';
}

export default function TripView({ trip }) {
  const { data } = trip;
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const facts = data.facts || {};
  const { headline, subhead } = splitTitle(data.title, data.destination);
  const stops = useMemo(() => computeStops(data.itinerary || []), [data.itinerary]);
  const perks = useMemo(() => numberedPerks(data.otherPerks || []), [data.otherPerks]);
  const primary = data.primaryHighlights || [];
  const nature = data.natureHighlights || [];
  const cities = data.cityHighlights || [];
  const food = data.culinaryHighlights || [];
  const todo = data.thingsToDo || [];
  const sectionCopy = data.sections || {};

  const sections = useMemo(() => {
    const list = [{ key: 'hero', label: 'HERO' }];
    if (data.brief) list.push({ key: 'idea', label: 'THE IDEA' });
    if (data.itinerary?.length) list.push({ key: 'route', label: 'ROUTE' });
    if (primary.length) list.push({ key: 'primary', label: 'HIGHLIGHTS' });
    if (nature.length) list.push({ key: 'nature', label: 'NATURE' });
    if (cities.length) list.push({ key: 'cities', label: 'CITIES' });
    if (food.length) list.push({ key: 'food', label: 'FOOD' });
    if (todo.length) list.push({ key: 'todo', label: 'TO DO' });
    if (data.otherPerks?.length) list.push({ key: 'why', label: 'WHY IT WORKS' });
    return list;
  }, [data, primary.length, nature.length, cities.length, food.length, todo.length]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    root.scrollTop = 0;
    setActiveIndex(0);
    const els = Array.from(root.querySelectorAll('[data-sec]'));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveIndex(Number(e.target.getAttribute('data-sec')));
        });
      },
      { root, threshold: 0.5 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [trip.slug, sections.length]);

  function goTo(i) {
    const root = scrollerRef.current;
    const el = root?.querySelector(`[data-sec="${i}"]`);
    if (el) root.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  }

  return (
    <div className="trip-scroller" ref={scrollerRef} style={themeVars(data.theme)}>
      <div className="back-link" onClick={goHome}>
        ← ALL TRIPS
      </div>
      <SlideNav sections={sections} activeIndex={activeIndex} onSelect={goTo} />

      {sections.map((sec, i) => {
        switch (sec.key) {
          case 'hero':
            return (
              <HeroSection
                key={sec.key}
                index={i}
                data={data}
                facts={facts}
                headline={headline}
                subhead={subhead}
                stops={stops}
              />
            );
          case 'idea':
            return <IdeaSection key={sec.key} index={i} data={data} facts={facts} primary={primary} />;
          case 'route':
            return <RouteSection key={sec.key} index={i} data={data} stops={stops} />;
          case 'primary':
            return <PrimarySection key={sec.key} index={i} items={primary} copy={sectionCopy.primary} />;
          case 'nature':
            return <NatureSection key={sec.key} index={i} items={nature} copy={sectionCopy.nature} />;
          case 'cities':
            return <CitiesSection key={sec.key} index={i} items={cities} copy={sectionCopy.cities} />;
          case 'food':
            return <FoodSection key={sec.key} index={i} items={food} copy={sectionCopy.food} />;
          case 'todo':
            return <ThingsToDoSection key={sec.key} index={i} items={todo} copy={sectionCopy.thingsToDo} />;
          case 'why':
            return <WhySection key={sec.key} index={i} perks={perks} copy={sectionCopy.why} onHome={goHome} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
