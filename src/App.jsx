import { useEffect, useState } from 'react';
import Home from './Home.jsx';
import TripView from './TripView.jsx';
import { useTrips } from './hooks/useTrips.js';

function slugFromHash() {
  return (location.hash || '').replace(/^#\/?/, '');
}

export default function App() {
  const trips = useTrips();
  const [slug, setSlug] = useState(slugFromHash());

  useEffect(() => {
    const onHashChange = () => setSlug(slugFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const trip = trips.find((t) => t.slug === slug) || null;

  if (trip) {
    return <TripView trip={trip} />;
  }
  return <Home trips={trips} />;
}
