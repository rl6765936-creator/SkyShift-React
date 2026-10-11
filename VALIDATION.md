# Validation

- Strict TypeScript and production Vite build: passed.
- Seven Playwright browser scenarios: passed against test-only API interception.
- Ten routes checked at desktop 1440px and mobile 390px: no unhandled JavaScript
  errors, no page-level horizontal overflow, navigation working.
- Registration body, selection with real vehicle ID, flight date-only payload,
  no-content success, 409 conflict, active-assignment flow, Manager route guard,
  401 session clearing, expired-session restore rejection and manager
  pagination/status restrictions exercised in the browser suite.
- Original backend: 104 source/configuration/test/document files compared
  byte-for-byte to the supplied ZIP; no modifications.
- Visual review: landing page, participant dashboard, manager dashboard and
  mobile fleet cards inspected from screenshots.

The previews/ images are browser captures with **test fixture records**, used
only to demonstrate layout. Their numbers are not data from your database.
The production app does not load these fixtures. Only the separately requested
vehicle model/specification/image adapter uses visual preview data.

Still required on your computer: run your existing backend and SQL Server,
then verify the Manager-create → User-select → User-record → Manager-review
flow against the live API. This workspace has no connection to that database.

- Home animation verified: pause/replay, off-screen containment, reduced-motion
  static mode and desktop/mobile layout. Preview frames inspected at road and
  airborne phases.
