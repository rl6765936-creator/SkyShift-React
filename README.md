# SkyShift React

React + TypeScript frontend for the supplied SkyShift ASP.NET Core backend.
Uses the updated SkyShift backend API (flight guards, gender and vehicle metadata).
The reference image guides the colors, air-vehicle imagery, cards, navigation,
landing page, participant dashboard and manager workspace.

## Quick start / התחלה מהירה

1. Extract this ZIP into a separate frontend folder alongside your backend.
2. Use Node.js 22.12+ or 24+.
3. Run `npm ci`.
4. Copy `.env.example` to `.env` (Windows: `copy .env.example .env`).
5. Start your existing backend at `https://localhost:7080`.
6. Run `npm run dev` and open `http://localhost:5173`.

Vite proxies `/api` to `BACKEND_URL`, avoiding cross-origin requests during
local development without modifying backend code. If your backend uses another
address, change only `BACKEND_URL` in the frontend `.env`.

The backend must already have its SQL Server connection, JWT signing key and
migrations configured according to its existing README. This frontend does not
ship or require those secrets. Do not put them in a `VITE_*` variable.

Public demo accounts already defined by the supplied backend:

| Role    | Email                 | Password      |
| ------- | --------------------- | ------------- |
| User    | user@skyshift.demo    | User@12345    |
| Manager | manager@skyshift.demo | Manager@12345 |

The existing backend seeds these accounts, but not vehicles. If the catalog is
empty, sign in as Manager, add a vehicle, then sign in as User and select it.

## API data and supplied images

Gender is sent on registration as Male/Female, restored from login and kept in the session after refresh. Legacy accounts with null gender keep their prior local addressing preference.

Vehicle cards show manufacturer and model, seats and maximum road speed from the API. Each value carries a label from `seatsAccuracy` / `maxRoadSpeedAccuracy`: "Manufacturer specification" (Verified) or "Illustrative" (SkyShift sample data, not a manufacturer specification). Visual-inspiration models are marked as such, and every catalog vehicle states that the propellers are an illustration and the road car does not fly. The manager loads unused models from GET /api/manager/vehicles/catalog and sees locked manufacturer, model, road speed, seats and bilingual description. POST /api/manager/vehicles sends only catalogItemId and isPersonalExperimental. The backend resolves authoritative metadata and rejects duplicate catalog items with 409 `catalog_item_in_use`.

Catalog files are bundled in public/catalog. The backend persists 22 catalog entries and image paths; React serves the image files. A filtered unique index prevents reusing a catalog model across vehicles. Existing vehicles are left unchanged and unlinked by the backend migrations. The old `backend-update` folder must not be installed; see the backend's CATALOG-UPDATE.md.

Flight date is converted from local time to UTC. The server enforces the actual assignment month, future dates and duplicate reports. ProblemDetails messages follow the selected language, including switching language after an error. Flight verification from a trusted vehicle source is future work.

Home videos, language versions, music/silent variants and local fonts are preserved. Audible autoplay remains subject to browser policy and has an explicit play button fallback.

## Screens

- `/`: reference-inspired landing page.
- `/login`, `/register`: authentication. Registration logs the user in immediately.
- `/dashboard`: current trial flights, expected monthly trips, completion,
  server-computed lottery eligibility and current vehicle.
- `/vehicles`: available fleet, type filter and confirmed selection.
- `/my-vehicle`: current vehicle and visual concept details.
- `/record-flight`: records a date against the server-derived active vehicle.
- `/manager`: server-provided counts, status distribution, participation and activity.
- `/manager/vehicles`: all fleet statuses, creation, permitted status changes.
- `/manager/users`: activity list and local search.
- `/manager/flights`: server filtering/pagination and all-time aggregate statistics.
- `/manager/assignments`: active and ended assignments, history filters.

No profile-editing, password reset, personal flight history, flight booking,
flight routes, flight hours, assignment mutations, user editing, reporting/export
or vehicle deletion API is present in the ZIP, so these operations are not added.

## API and state

- `src/api.ts`: typed API functions, bearer header, ProblemDetails/validation handling,
  empty 204 support, session expiry notifications and request cancellation.
- `src/auth.tsx`: tab-session storage, decoding the actual JWT role claim,
  expiry timer, sign-out and removal of query caches between identities.
- TanStack Query handles server state, loading/error/empty states and invalidation
  after mutations. Forms and filters use local React state.
- Frontend role checks control presentation only; server `[Authorize]` attributes
  remain the authority for permissions.
- User `Vehicle.status` is a numeric enum (0–4), while manager statuses are strings.
  This difference is preserved in the TypeScript contracts.
- Dates are sent as ISO timestamps. The trial is always one month, determined by
  the server. The frontend does not invent trial dates or recompute eligibility.
- Recording a flight sends only `{ date }`. Selection sends only `{ vehicleId }`.
  Creation sends only `{ isPersonalExperimental }`.

## Validation

`npm run build` performs strict TypeScript checking and a production build.

For browser tests:

```sh
npx playwright install chromium
npm test
```

The browser suite supplies **test-only intercepted API responses**, never
production demo data. It verifies registration request shape, real-ID selection,
flight request shape/204 success, conflict handling, role guards, session expiry,
manager status restrictions and pagination, desktop/mobile navigation, overflow,
and runtime errors. It writes screenshots into `test-results/`.

The supplied SQL Server backend cannot be reached from this workspace. Therefore
browser verification is against contracts mirrored from source, and is not a
claim of successful end-to-end execution against your running database. Perform
one real Manager → User workflow after starting the backend locally.

## Production

Run `npm run build`. Serve `dist/` with SPA fallback to `index.html`.
Route `/api/*` through your web server/reverse proxy to the unchanged backend;
Vite's development proxy does **not** exist in the production build.
Alternatively, set the public HTTPS `VITE_API_BASE_URL` before building and use
an origin already permitted by your backend's existing CORS configuration.
Never deploy against an HTTPS page with an HTTP API origin.

## צבעים

All required values are in `:root` in `src/styles.css`: indigo `#243B7A`, lavender
`#8178D8`, sky blue `#8CCFE8`, turquoise `#4FAFC0`, champagne `#D8B36A`, cream
`#F8F6F1`, white `#FFFFFF`, soft blue `#EAF2F7`, text `#172B4D`, muted `#718096`.
Most surfaces remain light; indigo, lavender, turquoise and gold act as accents.

## Home animations

The home page includes a small one-time takeoff within the hero artwork and
a contained traffic animation: the existing SkyCar Five concept lifts above
a queue and flies past it. The scene pauses outside the viewport, has pause
and replay controls, and uses a static airborne view for reduced motion.
This is an illustrative concept, not a backend simulation or a flight booking
feature. It uses CSS/SVG and existing local artwork, with no new dependency.
`previews/SkyShift-takeoff.mp4` is a capture of the same animation.

## Git readiness

See GIT-READY-he.md. Local environment files, dependencies and build output are ignored. All 22 catalog images and the four language/audio video variants are bundled locally. The supplied backend catalog patch must be applied before using manager vehicle creation.
