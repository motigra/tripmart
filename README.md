# Tripmart

A small web app for choosing between holidays.

You research a handful of candidate destinations, write each one up as a single JSON file, and the
app renders it as a scroll-through, magazine-style page: a hero shot, the pitch, the route stop by
stop, then highlights grouped into nature, towns and food, and a closing list of reasons the trip
works. The home page shows every candidate as a card.

The point is that someone who did none of the research can browse the options and pick one.

Nothing about the app is tied to a particular set of trips — the destinations are just data. Fork it,
empty the `trips/` folder, and it becomes a brochure for whatever you are choosing between.

## Running it

```bash
npm install
```

```bash
npm run dev
```

`npm run build` produces a static site in `dist/`; `npm run preview` serves that build locally.

## Adding a destination

Drop a JSON file into `trips/`. That is the whole process — `src/hooks/useTrips.js` discovers
`trips/*.json` at build time and the filename becomes the URL slug. There is no registry to update
and no route to add.

Copy an existing file as the starting point. Each one carries its own content *and* its own colour
palette, so a destination is entirely self-describing:

```jsonc
{
  "destination": "...",        // shown on the card and as the section heading
  "title": "Headline: Subhead", // split on the first colon
  "heroImage":  { "url": "...", "caption": "...", "credit": "..." },
  "ideaImage":  { "url": "...", "caption": "..." },
  "theme":      { /* ten colour tokens, applied as CSS variables */ },
  "brief":      "...",          // the pitch paragraph
  "facts":      { /* the key-value table: season, currency, language, driving... */ },
  "itinerary":  [ { "days": "2-4", "location": "...", "description": "..." } ],
  "primaryHighlights":  [ /* 3 — the headline attractions */ ],
  "natureHighlights":   [ /* 3-6 cards, 5 is a comfortable default */ ],
  "cityHighlights":     [ /* 3-6 */ ],
  "culinaryHighlights": [ /* 3-6 */ ],
  "otherPerks": [ "...", "..." ]  // auto-numbered closing list
}
```

Sections are skipped when their array is empty or missing, so a partial entry still renders.

A few parsing rules are worth knowing before you write one — `bestSeason` is split on an em dash,
and consecutive itinerary legs merge into a single stop when their location's first word matches.
`CLAUDE.md` documents the schema field by field, including those.

Images are hotlinked absolute URLs; there are no local assets. Wikimedia Commons is the most
reliable source, and `CLAUDE.md` has a recipe for pulling working URLs from its API.

## How it is built

Vite and React, no router, no state library, no backend. Routing is a hash fragment, so the built
output is a plain static site that can be served from anywhere. Theming is ten CSS custom properties
per trip, set inline from the JSON, which is why each destination can look different without any
component changes.

```
trips/          one JSON file per destination — all the content
src/
  App.jsx       hash routing
  Home.jsx      the card grid
  TripView.jsx  assembles a destination page
  components/   the page sections and the highlight grid
  lib/          theming, and values derived from the JSON
```

## Status

A work in progress. The route section currently renders a placeholder where a map will go, the home
page has no map yet, and some images are still stand-ins.
