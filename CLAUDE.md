# Tripmart

A single-page travel brochure app. Each destination is a self-contained JSON file that renders as a
scroll-through, magazine-style "pitch" for that trip.

**What it is for:** the repo owner researches candidate holidays; a non-technical reader browses the
rendered pages and picks between them. That reader is the audience for every word of visible copy —
they do not want to read caveats, logistics or research. Analysis, hedging and open questions go in
`_notes` or the private layer, never into rendered fields.

## Privacy contract — read before writing anything

**This repo is intended to be published publicly. It must contain no personal information.**

| Layer | Location | Committed? | May contain |
|---|---|---|---|
| Public | everything tracked by git | yes | **Destination facts only** |
| Private | `.private/` | **no** — gitignored | Traveller profile, per-trip planning rationale, origin/flight logistics |

Concretely, the following must **never** appear in a tracked file:

- Names, email addresses, family details, home city, nationality, or residence
- **Origin airport or departure-side flight reasoning.** Trip JSONs name *destination* airports only.
  A finding like "no nonstop from X until March 2027" is origin-revealing — it belongs in
  `.private/notes/<slug>.md`, with the committed `_notes` saying only what it means for the itinerary.
- Travel-window reasoning tied to a national or religious calendar. Say "a September or early-October
  start" — never name the holidays that drive the date.
- Personal preferences framed as facts about a person. Reframe them as facts about the destination:
  write "Korea's eating culture works completely sober", not "he does not drink".

`.private/` is gitignored and **has never been committed** — verified against full history on 2026-08-30.
Keep it that way. Run the privacy check before committing:

```bash
node .private/check-privacy.mjs
```

### Private layer contents

- `.private/PROFILE.MD` — the traveller profile: who is travelling, style, pace, food, comfort, safety
  constraints, past trips, and the origin/flight-logistics section. **Read it before planning any
  itinerary.** It is the source of truth for every routing and pacing decision in this repo.
- `.private/TODO.md` — the pre-publication roadmap. See "Planned work" below.
- `.private/check-privacy.mjs` — the privacy gate. It lives here rather than in the repo because its
  rules spell out the exact strings being kept out; committing it would defeat the point. It scans
  only what git would commit, so it never reads `.private/` and cannot leak itself.
- `.private/notes/<slug>.md` — per-trip planning rationale: why this length, why these bases, profile
  fit, rejected options, and open questions awaiting the owner.

If `.private/` is not on disk (fresh clone), **ask for it** — do not reconstruct it, and do not infer the
profile from the trip files.

## Commands

```bash
npm run dev
```

`npm run build` produces `dist/`; `npm run preview` serves it. There are no tests and no linter.

`node .private/check-privacy.mjs` scans everything git would commit for personal-information
patterns. It is deliberately not an npm script — `package.json` is public, and pointing it at a
gitignored path would break for anyone who forks the repo.

## Architecture

Vite + React 19, no router, no state library, no backend.

- `src/hooks/useTrips.js` — auto-discovers `trips/*.json` with `import.meta.glob`. **Adding a
  destination means adding one JSON file and nothing else.** The filename (minus `.json`) becomes
  the slug. Cards on the home page are sorted by slug.
- `src/App.jsx` — hash routing. `#/` is the grid, `#/<slug>` is a trip.
- `src/TripView.jsx` — decides which sections exist (a section is skipped when its array is empty
  or missing) and renders them in fixed order: hero, idea, route, primary, nature, cities, food,
  things to do, why.
- `src/components/Sections.jsx` — the eight section components. Read this before changing any field
  semantics; it is the authority on what actually gets displayed.
- `src/lib/tripHelpers.js` — the derived-value logic that the schema gotchas below come from.
- `src/lib/theme.js` — maps a trip's `theme` object to CSS custom properties, applied inline on the
  trip root so each trip has its own palette.
- `src/components/RouteMap.jsx` — the route map. See [Maps](#maps).

## Trip JSON schema

Every key below is present in every trip file. Copy an existing file rather than writing one from
scratch. `trips/portugal.json` and `trips/canada-east-coast.json` are the reference implementations.

| Field | Type | Notes |
|---|---|---|
| `_notes` | string[] | **Not rendered.** Destination facts, seasonality findings, routing constraints. JSON has no comments, so this is the comment channel. Subject to the privacy contract — planning rationale goes in `.private/notes/` instead. |
| `destination` | string | `"Country — Region A, Region B & Region C"`. Shown on the home card and as the idea-section heading. |
| `title` | string | `"Headline: Subhead"`. **Split on the first `:`** — the part before becomes the hero `<h1>`, the part after becomes the hero subtitle. A title without a colon leaves the subhead falling back to `destination`. |
| `heroImage` | `{url, caption, credit}` | Full-bleed background of the hero slide. `caption` is uppercased into the corner credit line. |
| `ideaImage` | `{url, caption}` | Side image on the idea slide. Falls back to `primaryHighlights[1].image` if absent — but always set it explicitly. |
| `theme` | object | Exactly ten keys: `bg ink dim line panel deep onDeep accent mapLand mapLine`. Give each trip a palette that matches its landscape. `deep`/`onDeep` are the dark sections (nature, why); `accent` is the highlight colour. |
| `brief` | string | 2–4 sentences. The pitch paragraph on the idea slide. |
| `vibe` | string | One short line (a handful of words). Shown on the home-page card in place of a season/date line — those all fall in the same autumn window across the collection, so a season is not a differentiator. Distinct from `brief`: `brief` is the fuller pitch, `vibe` is the one-line hook. |
| `sections` | object | Per-destination section copy, keyed `primary` `nature` `cities` `food` `thingsToDo` `why`. Each is `{heading, intro}`. `heading` replaces the section `<h2>`; `intro` is a sentence or two below it. Both optional — a missing `heading` falls back to the plain section name (`Highlights` / `Nature` / `Cities & Towns` / `Food` / `Things to Do` / `Why It Works`), and a missing `intro` renders nothing. |
| `facts` | object | Ordered key–value table. See [facts keys](#facts-keys). |
| `itinerary` | object[] | `{days, location, lat, lon, nights, description}` per leg. See [itinerary rules](#itinerary-rules). |
| `primaryHighlights` | object[] | **Exactly 3** — the eyebrow is hardcoded to "THE BIG THREE". `{title, description, image, caption?}`. |
| `natureHighlights` | object[] | **3–6 items, 6 preferred.** Same shape. |
| `cityHighlights` | object[] | **3–6 items, 6 preferred.** Towns you would actually sleep in or stop at. |
| `culinaryHighlights` | object[] | **3–6 items, 6 preferred.** |
| `otherPerks` | string[] | 7–8 strings. Auto-numbered `01`, `02`, … under "Why it works for us". |

Counts are not enforced in code. `HighlightGrid` sets a `data-grid` attribute and the CSS picks a
column count from it: 3 items give one row of three, 4 give a 2×2, and **5 and 6 both lay out as
three columns** — which is why six sits as comfortably as five and a sixth card can be added without
touching CSS. Below three a section looks thin; above six the rows get cramped.

Several existing entries have exactly five in each section. That is a historical default, not a
rule — the current files are simply not yet filled out to six where a sixth would earn its place.

### No subject appears twice

A place or dish gets exactly one card across nature, cities, food and things to do. If an attraction
is filed under the wrong section, move it rather than duplicating it — Gyeongbokgung and Dongdaemun
were "cities", Rocca Calascio was a "city", and Sacra di San Michele was a "city"; all four are now
Things to Do.

The one deliberate exception is `primaryHighlights`, which is a three-card summary of the whole trip
and is expected to name things that reappear in detail further down.

### Card copy: `description` vs `caption`

Both render on every highlight card, and they do different jobs:

- **`description`** — what the *destination* is like. Evocative, no logistics. Rendered on the
  bottom-scrim overlay along with the title.
- **`caption`** — what the *photo* shows, not trip logistics. Rendered as a small monospace badge
  in the image's top-right corner, the same treatment as `ideaImage.caption`. Optional.

`caption` is **not** the place for opening seasons, permits, or timing advice — that was the old
convention and is being retired; a card showing that kind of practical note is content debt left
over from before this change, not a model to copy. It is also still not an image credit; the hero
image remains the only place a credit is shown.

### `facts` keys

`src/lib/tripHelpers.js` maps known keys to short labels. **Unknown keys render with the raw key
uppercased**, so stick to this list:

`recommendedDurationDays` (number; rendered as "N days"), `flexibleRangeDays`, `bestSeason`,
`currency`, `language`, `timezone`, `arrivalAirport`, `departureAirport`, `driving`,
`flightsWithinTrip`, `familyNote`.

Omit keys that do not apply. `arrivalAirport`/`departureAirport` are the **destination-side**
airports — never the origin.

### Renderer gotchas

These are easy to get wrong and produce silently bad output:

1. **`bestSeason` is split on an em dash (`—`).** Only the part *before* it is shown on the home
   card and the hero "WHEN" stat; the full string is the hover title. Write
   `"Early October — why this month"`. Do not use an em dash anywhere else in the value. En dashes
   (`–`) inside the first half are fine and read better: `"Early–mid October — ..."`.
2. **Consecutive itinerary legs merge into one "stop" when their location's first word matches.**
   That is how `"Toronto (arrival)"` + `"Toronto"` become a single stop. It also means two unrelated
   consecutive legs starting with the same word will silently merge. The parenthetical is stripped
   before comparison.
3. **`days` is parsed by splitting on `-`.** Use `"5-7"`, not `"5–7"` and not `"5 to 7"`.
4. The hero **STOPS** count is derived from the merge above, not from the leg count.

### Itinerary rules

- Leg 1 is always the arrival day: `"<City> (arrival)"`, `nights: 1`, describing the airport-hotel
  arrival routine (see the profile).
- The last leg is always `"Departure from <City>"` with `nights: 0`.
- `days` runs consecutively from `1` with no gaps.
- `nights` is **never rendered** — nothing in `src/` reads it. It is metadata for the author.

Two arithmetic conventions hold across the six 2026 entries and are worth keeping: the final day
number equals `facts.recommendedDurationDays`, and `sum(nights) == recommendedDurationDays - 1`.
`portugal.json` and `canada-east-coast.json` predate the convention and satisfy neither — Canada's
itinerary even runs to day 18 while its `recommendedDurationDays` says 16. Do not "fix" them
without asking; the rendered output is unaffected.

## Maps

`RouteSection` renders a live map beside the timeline, built on **Leaflet + OpenStreetMap raster
tiles**. Chosen because it needs no API key and no billing account, so the build stays static and
deploys to GitHub Pages unchanged. Google's Embed API was the first choice but requires a key, which
would be exposed in a public build.

- Each itinerary leg carries `lat` / `lon` — approximate town centres. The map is a frame of
  reference, not a navigation aid, and the lines between stops are straight, not routed.
- `computeMapRoute()` in `tripHelpers.js` derives the geometry. Legs whose location starts with
  "Departure" stay in the **line** (so a loop closes back on itself) but get no **pin** — they are
  not places you stay. Consecutive legs at the same coordinates collapse to one pin, the same way
  `computeStops` merges an arrival night into the city that follows it.
- Hops longer than `LONG_HOP_KM` (800) draw dashed, because they cannot have been driven. Only
  Portugal's Lisbon–Azores flight qualifies. **Do not lower this** — the longest genuine driving leg
  in the collection is Salt Lake City to Zion at 409 km, and a 400 km threshold wrongly dashed it.
- `fadeAnimation: false` is deliberate. The section mounts off-screen and is resized as the page
  scrolls to it, which interrupts Leaflet's tile fade and leaves tiles stuck around 0.17 opacity.
- A trip with no coordinates falls back to the old `Map coming soon` placeholder, so a
  part-finished entry still renders.

## Images

No local assets. Every image is a hotlinked absolute URL. Prefer **Wikimedia Commons** — the older
entries also use random blog/tourism-board hosts, which are more likely to rot.

Get real, verified URLs from the Commons API rather than guessing paths (the `upload.wikimedia.org`
directory hashes cannot be constructed by hand):

```bash
curl -s -G https://commons.wikimedia.org/w/api.php -H 'User-Agent: YourBot/1.0' --data-urlencode 'action=query' --data-urlencode 'format=json' --data-urlencode 'generator=search' --data-urlencode 'gsrsearch=filetype:bitmap Lago di Scanno' --data-urlencode 'gsrnamespace=6' --data-urlencode 'gsrlimit=3' --data-urlencode 'prop=imageinfo' --data-urlencode 'iiprop=url' --data-urlencode 'iiurlwidth=1600'
```

Use the returned `thumburl` and **strip the `?utm_*` query string**.

Two hard-won warnings:

- **Send a `User-Agent`, and pace requests ~1.5s apart.** Wikimedia returns `429` aggressively and
  will then throttle your IP for a while.
- **Do not verify links by hammering `upload.wikimedia.org` in parallel** — you will get a wall of
  `429`s that look like dead links but are not. To verify a batch, query the API with
  `action=query&prop=imageinfo&titles=File:A|File:B|...` (40 at a time) and check for `missing`.

Pick images that are in colour and read well at card size; a striking hero matters more than
technical accuracy, since the home grid is what gets browsed first.

## Research standards

**Seasonality is the known failure mode.** A previous shortlist candidate was dropped after
discovering that alpine-resort infrastructure shuts down from roughly 15 September. Every new
destination must be checked for closures in the target month — lifts, mountain passes, park roads,
island/garden seasons, ferry timetables, tourist infrastructure — and the finding recorded in
`_notes` with the date it was verified, **even when the answer is "no risk"**.

Also verify:

- Driving times for every leg, against the pacing limits in the profile.
- Realistic flight access, including whether a nonstop exists. Fares and routes change, so date-stamp
  the finding — and put it in `.private/notes/<slug>.md`, since it is origin-dependent.
- Anything that materially changes the itinerary if wrong.

State assumptions rather than blocking on them, and surface genuine open questions to the owner in
chat and in `.private/notes/<slug>.md`.

## Writing style

Rendered copy is for the non-technical reader, not the researcher:

- Warm, plain, concrete. Short sentences. No travel-brochure superlatives, no jargon.
- Describe what it looks and feels like, not logistics. "A heart-shaped mountain lake at the end of
  a spectacular gorge road" — not "SP479, 22 km, moderate gradient".
- **Never put caveats, booking mechanics or open questions in rendered fields.** Closure and
  opening dates used to be the exception, kept in a card's `caption` — that is no longer `caption`'s
  job (see [Card copy](#card-copy-description-vs-caption)) and where this kind of note belongs now
  is an open question pending a content-migration pass. Until that's decided, do not add new
  closure/opening-date notes to `caption`.
- **No research-criteria language.** The copy must not read as though it is answering a brief.
  If a line only makes sense to someone who has read the profile, either cut it or convert it so the
  reassurance arrives through the content instead:

  > "Very little seafood pressure — Piedmont is a meat-and-butter region"
  > → "Piedmont cooks in butter and hazelnuts — braised beef, stuffed pasta, chocolate by the bar"

  Same information reaches the reader; nobody mentions the rule. Watch for the tells: defining by
  negation ("not X", "rather than Y"), naming the constraint, and comparing this destination to the
  others in the collection.
- **`otherPerks` are perks, not summary.** A perk is something the reader *gains* that is not already
  obvious from the itinerary or a highlight card, and that assumes nothing has been booked. Keep them
  to roughly 8–14 words; the grid puts eight items in four columns.

  | Out | Why |
  |---|---|
  | "Nine nights in Colorado, six in Utah" | itinerary, restated |
  | "Zion is a green river canyon" | already a highlight card |
  | "Three nights per base in houses with kitchens" | assumes accommodation nobody has booked |
  | "The best driving in the collection" | comparative — meaningless to someone reading one page |

  | In | Why |
  |---|---|
  | "Three of the great American drives, in one trip" | a checklist win you can cross off |
  | "Hot springs in Buena Vista and Ouray, after the walking days" | a reward with no card of its own |
  | "Everything in English, superb roads, a supermarket in every town" | practical ease of life |
  | "Aspens peak in the San Juans in early October — whole mountainsides at once" | seasonal timing *with the payoff spelled out* |

  Seasonal openings are fair game and useful — say that a lift or a road is running in the travel
  month. Comfort and practicality are legitimate perks too; just phrase them in this destination's
  own terms rather than the same way eight times.
- British spelling (`colour`, `neighbourhood`), matching the existing entries.

## Current collection

| Slug | Status |
|---|---|
| `portugal` | Original shortlist |
| `canada-east-coast` | Original shortlist |
| `italy-west` | Added Aug 2026 |
| `italy-abruzzo` | Added Aug 2026 |
| `french-alps` | Added Aug 2026 |
| `croatia-istria` | Added Aug 2026 |
| `south-korea` | Added Aug 2026 |
| `rockies-southwest` | Added Aug 2026 |

Trip lengths live in each file's `facts.recommendedDurationDays`, but treat them as proposals rather
than settled — they move as itineraries get revised, so avoid restating them elsewhere.

Open questions are tracked per trip in `.private/notes/<slug>.md` — currently outstanding on
`south-korea` (trip length vs. flight access), `rockies-southwest` (dates vs. autumn colour, and the
Colorado/Utah balance) and `croatia-istria` (whether a Montenegro extension is in scope).

## Planned work — do not start it unprompted

`.private/TODO.md` lists eight workstreams planned before publication: de-duplicating copy across
destinations, a per-destination research deep-dive, route maps, an interactive home-page map, an
instruction box on the home page, a localStorage-based feedback mechanism, a per-destination
validation pass, and GitHub Pages deployment.

**None of these are authorised to begin.** The owner has said explicitly that each item will get
their input before it starts, and every one carries open scope decisions. Do not pick an item off
that list because it looks like the obvious next task, and do not start one as a side effect of
adjacent work. If you have capacity and no instruction, ask which item to take.

The roadmap lives in the private layer, so on a fresh clone it will not be there — same rule as the
profile: ask, do not reconstruct.

It also records known content debt found during the August 2026 pass — image substitutions where
Commons had no good free photo, and two trips that reuse one image twice on the same page. Fix those
under item 2 when it is actually commissioned.

## Repo files

- `README.md` — public-facing: what the project is, the JSON format, how to run it. Deliberately
  generic, with no destination content and no trip lengths, so the repo reads as a reusable tool for
  anyone who forks it. Keep it that way — adding a destination does not need a README change, and the
  privacy contract is documented here rather than there.
- `.claude/launch.json` — dev-server config for the in-app browser preview.
- `.private/TODO.md` — the pre-publication roadmap described above. Private, not committed.
- `.private/check-privacy.mjs` — the privacy gate. Add a pattern there whenever a new class of
  personal information becomes relevant.
