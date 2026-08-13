# FRHES Rebuild — Progress Tracker

(Standing note: nothing in this project has been compiled/executed except
the Flask AI service in Batch 1. Every batch since is careful, reviewed
code, not proven code.)

## ✅ Completed modules
**Backend** (Batches 1–3), **Frontend design system + core pages** (Batch 4),
**Feature completion pass** (Batch 5: dark mode, print mode, full token
migration), **Recognition Module** (Batch 6), **Student Module** (Batch 7:
CSV import wizard, profile drawer, shared validation). See prior tracker
entries for full detail on each.

## ✅ Analytics Module — COMPLETE (this batch)

**Critical cross-module bug found and fixed**: the backend uses two
different field names for the same value — `confidence` on the live-identify
`RecognitionResponse`, but `confidenceScore` on `RecognitionHistoryResponse`
(confirmed by reading both DTOs directly). Every component built across the
Recognition and Student Modules that renders a *history* record
(`RecognitionEventCard`, `RecognitionStatistics`, `RecognitionFilters`'
confidence-range filter, every CSV export's Confidence column,
`StudentProfileDrawer`'s latest-confidence readout) had been silently
reading `undefined` since they were all written against `.confidence`. Fixed
**once, at the API boundary** — `normalizeRecognitionRecord.js` — applied in
`recognitionApi.getRecognitionHistory`/`getRecognitionHistoryById` and
`analyticsApi.getRecentSuccessful`/`getRecentActivity`, rather than patching
every one of those consumers individually. This retroactively repairs all of
them without touching their code.

**Also found while migrating chart colors**: `TrendChart`/`PeakHoursChart`/
`TopCamerasChart` hardcoded old-palette hex values (`#3b6fe0` etc.) directly
in `stroke`/`fill` props — invisible to the repo-wide `bg-brand-*` class-name
searches done in earlier batches, since Recharts takes literal color values,
not Tailwind classes. Fixed by extracting `utils/chartTheme.js` (one shared
color/margin source) and migrating all three existing charts to it; a
repo-wide hex-literal search afterward confirmed zero remaining instances.

**New reusable components**:
- `utils/histogram.js` + `Histogram.jsx` — generic bucketed-histogram chart,
  shared by both `RecognitionLatencyChart` and `ConfidenceDistributionChart`
  rather than two near-identical implementations.
- `components/ui/Heatmap.jsx` — generic row×column intensity grid (no
  Recharts primitive covers this) + `RecognitionHeatmap.jsx` (day-of-week ×
  4-hour-band wrapper, derived client-side from already-fetched records;
  explicitly documented in-code as sample-bounded, same honest caveat as
  `RecognitionStatistics`).
- `utils/recognitionRecordFilters.js` — generalized client-side filtering
  (status, camera, department, student search, date range, confidence range,
  latency range), consolidating what was previously a narrower
  `applyClientFilters` defined inline inside `RecognitionFilters.jsx`.
  **That file was refactored to delegate to this shared function** instead
  of keeping its own copy — this also fixed a NaN bug in the old confidence-
  range check (silently a no-op due to the field-name bug above; now
  functions correctly with normalized data).
- `AnalyticsFilterPanel.jsx` — advanced filters (all 7 requested dimensions),
  honestly labeled in-UI as filtering the loaded sample, not the full
  dataset, since `getRecentActivity` takes no server-side filter params.
- `hooks/useSavedFilterPresets.js` (generic, localStorage-backed) +
  `AnalyticsSavedFilters.jsx` — deliberately has zero knowledge of what a
  "filter" contains (treats it as an opaque object), so it can't duplicate
  or drift out of sync with `AnalyticsFilterPanel`'s field definitions.
- `utils/analyticsExport.js` — `exportRecognitionRecordsCsv`,
  `exportSummaryCsv`, `exportAsPdf` (the last is a documented print-flow
  stand-in, not a real PDF library — none is installed). Exposed as
  standalone functions specifically so Reports can import the same helpers
  later instead of re-deriving column definitions.

**`AnalyticsPage.jsx` integration**: reuses every existing chart
(`SummaryCards`, `TrendChart`, `PeakHoursChart`, `TopCamerasChart`,
`HistoryTable`) unchanged in layout, adds the heatmap/latency/confidence
charts plus the filter panel and saved filters below them. `filteredRecords`
and `departments` are both `useMemo`'d off `(recentActivity, filters)` so
every panel reads one shared derived value instead of each re-filtering
independently. One fetch (`ACTIVITY_SAMPLE_SIZE = 50`) feeds every
client-derived panel — heatmap, latency, confidence, failure analysis, and
the filter panel's department list all come from the same
`getRecentActivity` call, not five separate requests for overlapping data.
Loading/error/empty states preserved on every section; `aria-label`s added
to each chart's containing `<section>`; export/range controls marked
`print:hidden` consistent with the existing Reports print flow.


## ✅ Analytics Module — additional items completed (this batch)

Added on top of the previously-completed Analytics integration (chart
migration, filters, saved filters, export helpers -- see above):

- **JSON export**: `downloadJson` added to `csvExport.js` alongside the
  existing `downloadCsv` (both now share a common `downloadBlob` helper
  internally); `exportRecognitionRecordsJson`/`exportSummaryJson` added to
  `analyticsExport.js`. AnalyticsPage now offers CSV *and* JSON export for
  both the filtered record set and the summary.
- **Advanced statistics**: `utils/analyticsUtils.js` (new) — `computePercentile`,
  `computeLatencyPercentiles` (P50/P95/P99), `computeConfidenceExtremes`
  (highest/lowest), `computeBusiestHour`, `computeBusiestWeekday`,
  `extractDepartments`. All pure, client-side, computed over the same
  already-fetched sample every other Analytics panel uses — no new fetch.
  Rendered via a new `AdvancedStatsCards.jsx`. **Deliberately did not modify
  `RecognitionStatistics.jsx`** (Recognition Module) to add these — that
  component is used by `RecognitionPage` outside Analytics and was explicitly
  off-limits this batch; `AdvancedStatsCards` is a separate, Analytics-only
  component instead, so Recognition Module output is unaffected.
- **Removed a duplicated calculation**: `AnalyticsPage`'s inline `useMemo`
  that derived the department list from `recentActivity` was replaced with
  a call to the new `extractDepartments` utility — same logic, now defined
  in exactly one place instead of two.


## ✅ Reports Module — COMPLETE

**New files** (`src/components/reports/`): `ReportCover`, `ReportHeader`,
`ReportFooter`, `ReportSection`, `ReportMetricGrid`, `ReportSignature`,
`ReportExportMenu`, `ReportBuilder`, `ReportLoadingSkeleton`,
`ReportEmptyState`, `ReportErrorState`. Plus `utils/reportTemplates.js`
(5 templates: Executive Summary, Recognition Activity, Student Recognition,
Department Summary, Full Audit — one shared config array, `ReportBuilder`
composes sections from it rather than each template having its own layout),
`utils/reportFormatter.js` (report-specific formatting, every function
delegates to the existing `formatters.js`/`analyticsUtils.js` — no
formatting logic duplicated), `utils/orgInfo.js` (branding constants), and
`styles/reports-print.css` (A4 portrait, running header/footer, page-number
margin box, forced page breaks between sections, break-inside-avoid on
cards/tables/charts, orphan-heading prevention, high-contrast print table
overrides).

**Every chart/table in the printable report is reused, not reimplemented**:
`RecognitionHeatmap`, `RecognitionLatencyChart`, `ConfidenceDistributionChart`,
`TopCamerasChart`, `PeakHoursChart`, `HistoryTable` — all imported directly
from the Analytics/Recognition Modules into `ReportBuilder`'s
`SECTION_RENDERERS` map.

**`ReportsPage.jsx` refactored to pure orchestration**: loads report data
(reusing `analyticsApi`), owns template/filter/date-range state (reusing
`AnalyticsFilterPanel` + `applyRecordFilters` + `extractDepartments` —
**no second filter implementation was built**), and passes fully-prepared
props into `ReportBuilder`. No section-rendering logic remains in the page itself.

**Judgment call, documented in-code**: the instruction asked for "exactly
one export implementation." The three pre-existing server-generated CSV
report cards (Recognition History / Student Directory / Activity Logs, via
`reportsApi.download*Report()`) query the *entire* filtered dataset on the
backend — genuinely more complete than the new client-side sample exports
(`exportRecognitionRecordsCsv`/`Json`, bounded to a ~100-record fetch).
Replacing them with the client-side helpers would have been a real
functional regression (silently shrinking what a "Recognition History
Report" actually covers), not a simplification, so the underlying
`reportsApi` calls were kept. What **was** unified: **every export button in
the module — the three report cards and both new record/summary exports —
now renders through the single `ReportExportMenu` component** (extended
with a `label` prop so it's reusable across contexts), rather than each
card having its own bespoke button. One UI implementation; two genuinely
different, non-substitutable data-fetching strategies underneath it,
because collapsing them would have silently made the product worse.

**Two real integration bugs caught before considering this done**:
1. `ReportCover` accepted no `dateFrom`/`dateTo` props at all — it would
   have silently always displayed "Coverage: All time" even with an active
   date filter. Fixed by threading `filters` through `ReportsPage` →
   `ReportBuilder` → `ReportCover`.
2. `ReportCover`'s title was an `<h1>`, colliding with `ReportsPage`'s own
   "Printable Reports" `<h1>` on the same screen — two H1s on one page.
   Downgraded to `<h2>` (the printed page's visual size is controlled by
   Tailwind classes, not heading level, so nothing looks different).
   Also confirmed `DashboardLayout` already renders the page's single
   `<main>` landmark — `ReportsPage` correctly does not add a second one.

**Dead code caught and fixed, not left behind**: `formatReportDateRange` in
`reportFormatter.js` was written but never called anywhere — caught during
the integration review and wired into `ReportCover` (which is also what
fix #1 above needed) rather than deleted, since the date-range display was
a genuine missing piece, not an unnecessary function.

**Accessibility**: single H1 per page; every section uses
`aria-labelledby` referencing its own visible heading (not a duplicate
`aria-label`); `ReportExportMenu` has `aria-haspopup`/`aria-expanded`,
`role="menu"`/`role="menuitem"`, and now closes on Escape (previously only
closeable by clicking outside or selecting an item — gap found and fixed
during this review); focus-visible styling is inherited automatically from
the global design system, not reimplemented per component.


## ✅ Notifications Module — COMPLETE

**⚠️ Recovery note**: partway through building this module (and starting
Help), this sandbox's working files were unexpectedly reset -- discovered
when a routine file check came back empty. The last *delivered* zip
(through the Reports Module) was intact and used to restore the project
before rebuilding Notifications from scratch on top of it. Nothing from
before Reports was lost; the Notifications/Help work in progress at the
time of the reset was rebuilt, not recovered, so it was re-verified fresh
rather than assumed correct from memory.

**Backend signal review** confirmed four existing endpoints already carry
notification-worthy data (no new backend API): `GET /recognition/history`
(failures/unknowns/low-confidence), `GET /actuator/health` (AI/DB/disk
health), `GET /users` (account lockouts, ADMIN-only), `GET /students`
(failed enrollments). Explicitly did not build an audit-log adapter -- the
only audit-log capability is a CSV file download, not a JSON-queryable
endpoint a poller could use, and inventing one would violate the "no new
backend API" constraint.

**Files**: `utils/normalizeNotification.js` (canonical model), four
`adapters/*NotificationAdapter.js` files, `context/NotificationContext.jsx`
(the single polling loop), `components/notifications/{NotificationCard,
NotificationList,NotificationDrawer,NotificationBadge,NotificationFilters,
NotificationEmptyState}.jsx`. `Topbar.jsx` extended with the bell/badge/
preview/drawer trigger; `App.jsx` wired with `NotificationProvider` (nested
inside `AuthProvider`, since it needs `useAuth`).

**Reused, not reimplemented**: `NotificationDrawer` sits on the existing
`Drawer` primitive (focus trap/Escape/click-outside/focus-restoration all
inherited); `NotificationList` composes the existing `SkeletonCard`/
`ErrorMessage`; `NotificationEmptyState` wraps the existing `EmptyState`
(matching the `ReportEmptyState` pattern from the Reports Module); a new
`formatRelativeTime` was added to the existing `formatters.js` rather than
duplicating date math inside `NotificationCard`.

**Polling lifecycle (verified)**: exactly one `setInterval` in
`NotificationContext`; gated on `isAuthenticated` (torn down on logout,
restarted on login); the poll function no-ops while `document.hidden` and a
`visibilitychange` listener triggers an immediate poll on returning to the
tab; a `fetchingRef` flag prevents overlapping requests. Notification ids
are derived from each record's own backend id (e.g. `recognition-42`,
`health-aiService`), not the poll timestamp, so read/dismissed state
persists across polls instead of every item looking "new" every 30 seconds.

**Role-awareness**: the ADMIN-only `securityNotificationAdapter` is only
included in the poll's adapter list when `user.role === ROLES.ADMIN`, so a
STAFF user never triggers a guaranteed 403 against `/users`.

**Accessibility**: bell button has `aria-haspopup`/`aria-expanded`/
`aria-controls`; a `sr-only`/`role="status"` live region announces unread
count changes independent of whether the dropdown is open; both of
Topbar's dropdowns (notifications and user menu) gained Escape-to-close
during this integration (neither had it before); `aria-controls` added to
the user-menu trigger to match the bell's pattern.

## ✅ Help page + About page — COMPLETE (this batch)

**Scope check first**: read `Sidebar.jsx`, `App.jsx`, `Topbar.jsx`, `SettingsPage.jsx`,
`orgInfo.js`, and the actual `pom.xml`/`package.json`/`docker-compose.yml`/
`requirements.txt` before writing anything, specifically so About page's
architecture claims are verified against the real repo rather than assumed.
Two corrections that came out of that check, both reflected in the new
pages: the tracker's own prior-batch prose said "Java 21, Spring Boot 3.3"
and mentioned Redis — the actual `pom.xml` says Spring Boot **3.2.5**/Java
**17**, and `docker-compose.yml` has no Redis service at all. About page
uses the verified values, not the earlier prose.

**New files**:
- `utils/faqContent.js` — pure data module, zero JSX. 8 categories (Getting
  Started, Students & Enrollment, Live Recognition, Notifications, Analytics
  & Reports, Account & Security, System Settings), each question grounded in
  actual app behavior read from the relevant component (e.g. the 5-pose
  enrollment sequence from `EnrollmentCapture.jsx`, the MATCHED/UNKNOWN/
  LOW_CONFIDENCE semantics from `RECOGNITION_STATUS`, the Analytics-sample-
  vs-Reports-full-dataset export distinction from the Reports Module's own
  documented judgment call). Two categories (`analytics-reports`,
  `settings`) carry a `roles: [ROLES.ADMIN]` gate. `filterFaqByRole` and
  `searchFaq` exported as standalone pure functions so `HelpPage` composes
  them rather than filtering inline.
- `components/help/FaqItem.jsx` — single accordion Q&A. Reuses the exact
  `aria-expanded` + chevron disclosure pattern already established by
  `RecognitionEventCard` instead of introducing a second expand/collapse
  convention into the codebase.
- `components/help/FaqSection.jsx` — category card composing `FaqItem`s;
  `aria-labelledby` references its own visible heading, matching the
  Reports Module sections' accessibility pattern.
- `pages/HelpPage.jsx` — client-side search over the static FAQ content (no
  fetch — there's nothing to fetch), role-aware via `useAuth()`'s
  `user.role`, empty-search state reuses the existing `EmptyState`/`Button`
  components rather than a bespoke "no results" block. Bottom "Still need
  help?" card branches copy by role: Admin is pointed at the README/System
  Settings, Staff is pointed at their administrator — no support email
  exists anywhere in the codebase, so one wasn't invented.
- `pages/AboutPage.jsx` — static system overview (version, 3-service
  architecture table, module list with Admin-only badges, data-handling
  notice). Reuses `ORG_NAME`/`ORG_SHORT`/`REPORT_CONFIDENTIALITY_NOTICE`
  from the existing `orgInfo.js` rather than restating org branding a
  second time.

**Wiring**: both routes registered in `App.jsx` at the same tier as
Profile/Change Password (inside `ProtectedRoute`, outside `RoleRoute` —
content is role-filtered internally instead of route-gated, since every
role should be able to reach Help). Discoverability added in two places
rather than one: a "Help" item in `Topbar`'s existing user-menu dropdown
(same button pattern as My Profile/Change Password), and a small "Help ·
About" footer line under Sidebar's "Signed in as" block.

**Bug caught during integration review, fixed before considering this
done**: curly quotes/ellipsis/arrow characters were initially written as
`\u` escape sequences directly inside JSX text children and inside a JSX
attribute string literal. Neither context is a JS string literal — JSX
text and JSX attribute strings are raw, not escape-processed — so this
would have rendered literal backslash sequences (`\u2026` etc.) on screen
instead of the intended characters. Fixed by wrapping each in a `{'...'}`
expression so the escape is evaluated as real JS. Caught by re-reading the
rendered output mentally against JSX semantics, not by a build step (no
dev server available in this sandbox — see the standing note at the top of
this file).

**Also fixed while touching `Sidebar.jsx`**: the "Signed in as" role span
had no `dark:` text-color class (`text-slate-600` with no dark variant),
inconsistent with every other text node in that file. Added
`dark:text-slate-300` to match.

**Accessibility**: single H1 per page (unchanged, `DashboardLayout`'s
`Topbar` still owns it via `handle.title`); each FAQ category section uses
`aria-labelledby`; the search input has an associated `sr-only` label;
`FaqItem`'s expand button carries `aria-expanded`/`aria-controls` pointing
at its panel, matching `RecognitionEventCard`'s established pattern.

**Verified, not assumed**: syntax-checked every new/modified file with
esbuild (`--loader` inferred from extension) after the escape-sequence fix
— all pass. Still not run through the actual Vite dev server or a browser
(see standing note); this is static verification, not proof.


## ✅ Backend test-suite fixes — verified via real `mvn clean test` run (this batch)

**This is the first time any part of this project has actually been
compiled and executed by the person, beyond Batch 1's Flask service** (see
the standing note at the top of this file). Two real bugs surfaced, neither
visible from static review — both fixed:

1. **`UserControllerSecurityTest` (6/6 tests erroring on context startup)**:
   `@WebMvcTest(UserController.class)` slices in `SecurityConfig`'s
   `SecurityFilterChain` bean (needed to exercise the real ADMIN-only rule
   the test is written to verify) and, because `JwtAuthFilter` is a
   `Filter` bean, `@WebMvcTest` pulls that in too. But `JwtAuthFilter`'s own
   two `@Autowired` fields (`JwtTokenProvider`, `CustomUserDetailsService`)
   are plain `@Component`/`@Service` beans, which `@WebMvcTest` does **not**
   include in its slice — so context startup failed with
   `UnsatisfiedDependencyException` before a single test method ran. Fixed
   by adding `@MockBean` for both in the test class. No behavior needed to
   be stubbed on either mock: every test path either carries no
   `Authorization` header or uses `@WithMockUser` (which populates the
   `SecurityContext` directly, ahead of `JwtAuthFilter`), so
   `JwtAuthFilter.doFilterInternal` never actually calls either mock — they
   only need to exist as beans so the filter chain can be constructed.
2. **`PasswordPolicyServiceTest.strictPolicyRequiresUpperLowerDigitAndSpecialChar`**:
   test-data bug, not a service bug. `PasswordPolicyService.validate()`
   correctly requires 10+ characters for STRICT, but the test's three
   example passwords (`"Abcdefg1!"`, `"abcdefg1!"`, `"Abcdefgh1"`) were all
   only 9 characters — one short — so each failed the length check before
   ever reaching the uppercase/special-character check the test was meant
   to exercise. Fixed by padding each to exactly 10 characters
   (`"Abcdefgh1!"`, `"abcdefgh1!"`, `"Abcdefghi1"`) while preserving which
   single property each is missing, so the assertions now test what they
   say they test. `PasswordPolicyService` itself was not touched.

**Also visible in the same run, not a bug**: `GlobalExceptionHandlerTest`
logs an `ERROR`-level stack trace for its
`unknownExceptionFallsBackTo500WithoutLeakingNullMessage` test — that's the
test intentionally throwing to verify the handler's fallback path; the log
line is expected output, not a failure (the test passed).

**Result**: all 53 backend tests pass after these two fixes (verified by
the person's own `mvn clean test` run, not by this environment — this
sandbox still can't compile/run the Java or Python halves of the project,
only static-review and syntax-check the frontend; see standing note).

**Not investigated this batch, flagged for awareness**: `mvn` output notes
`JwtTokenProvider.java` uses a deprecated API (`javac` deprecation
warning, not an error). Left as-is since it's out of scope for a test-suite
fix and isn't failing anything.


## 🚧 Frontend Automated Tests — IN PROGRESS (this batch: utils + shared UI)

**Scope note, read before extending this further**: a request came in this
batch asking for exhaustive coverage in one pass — every page, every hook,
full API mocking, a full accessibility suite, and end-to-end integration
tests across the whole app, packaged as a final, "complete" deliverable.
That's not something one batch can honestly deliver without either
fabricating coverage or writing shallow tests just to check boxes off a
list. This batch instead did a real, fully-verified slice and is reported
as exactly that — not as "done."

**Verified, not assumed**: unlike the backend (which this sandbox still
can't compile/run), the frontend test suite *was* actually installed and
executed here — `npm install` + `npx vitest run` — not just written and
hoped to pass. Result: **12 test files, 96 tests, all passing.**

**New test files** (all colocated with their source as `*.test.js(x)`,
following standard Vitest convention since none existed yet to follow):

*Pure utilities* (highest value: no rendering, exercises real business
logic, several of these lock in bug fixes from earlier batches):
- `formatters.test.js` — formatDateTime/formatPercent/formatConfidence/
  titleCase/formatRelativeTime, including fake-timer tests for the
  relative-time thresholds (just now → Xs → Xm → Xh → Xd → plain date).
- `studentValidation.test.js` — the shared validator used by both
  StudentForm and the CSV import wizard.
- `normalizeRecognitionRecord.test.js` — specifically locks in the
  `confidence`/`confidenceScore` field-name fix from the Analytics Module
  batch (the cross-module bug that silently broke every history-record
  consumer). Covers: confidenceScore→confidence copy, existing confidence
  left untouched, both-absent resolves to null (not undefined), no
  mutation of the original object.
- `analyticsUtils.test.js` — computePercentile/computeLatencyPercentiles/
  computeConfidenceExtremes/computeBusiestHour/computeBusiestWeekday/
  extractDepartments.
- `recognitionRecordFilters.test.js` — every filter dimension in
  `applyRecordFilters` (status, camera, student search, department, date
  range, confidence range, latency range) individually and combined with
  AND semantics, plus the empty-string-means-no-constraint edge case.
- `histogram.test.js` — bucket boundaries (`[min, max)` vs. final-bucket-
  inclusive), null/NaN filtering, open-ended final bucket, and both
  concrete bucket sets (`CONFIDENCE_BUCKETS`, `LATENCY_BUCKETS_MS`).
- `faqContent.test.js` — role-gating (`filterFaqByRole`) and search
  (`searchFaq`) from this batch's Help page work.

*Shared UI components* (RTL, `render`/`screen`/`userEvent`):
- `StatusBadge.test.jsx`, `ConfidenceMeter.test.jsx` (aria-valuenow/min/max,
  clamping, default), `Button.test.jsx` (variant fallback, loading disables
  and blocks clicks, aria-busy, default type="button"), `EmptyState.test.jsx`,
  `FaqItem.test.jsx` (aria-expanded toggling, aria-controls wiring to the
  actual panel id, defaultOpen).

**Not touched, per the "don't modify" constraint honored**: no backend
file, and no existing Recognition/Student/Analytics/Reports/Notifications/
Help/About/Dashboard/Login/Settings component was modified — only new
`*.test.js(x)` files were added alongside them.

**Explicitly still open, not started this batch** (this is the honest
remainder of the original ask, not a hidden backlog):
- Page-level tests: LoginPage, AdminDashboardPage, StaffDashboardPage,
  RecognitionPage, StudentsListPage, AnalyticsPage, ReportsPage, HelpPage,
  AboutPage, SettingsPage, and their constituent components not yet listed
  above (RecognitionTimeline, RecognitionEventCard, RecognitionStatistics,
  RecognitionFilters, RecognitionSessionPanel, StudentTable, StudentForm,
  StudentCsvImportWizard, StudentProfileDrawer, EnrollmentCapture,
  AnalyticsFilterPanel, AdvancedStatsCards, RecognitionHeatmap,
  RecognitionLatencyChart, ConfidenceDistributionChart, ReportBuilder,
  ReportExportMenu, ReportSection, NotificationDrawer, NotificationList,
  NotificationCard, HelpPage's own search/empty-state behavior, Modal,
  Drawer, Toast, Skeleton, ScanFrame). These need per-component API/router
  mocking decisions (most of these fetch data or depend on route context)
  that are worth doing deliberately rather than rushed.
- Hook tests: `useSavedFilterPresets`, `NotificationContext`'s polling
  lifecycle (setInterval gating, visibility pause/resume, overlap
  prevention — all called out as "verified" in the Notifications Module
  batch by code reading, not yet by an actual test).
- API-layer tests: no API module (`recognitionApi`, `analyticsApi`,
  `reportsApi`, `studentApi`, `authApi`) has mocked-fetch tests yet for
  success/failure/empty/retry paths.
- Accessibility test suite: today's tests check individual aria attributes
  incidentally (see ConfidenceMeter/FaqItem above); a dedicated keyboard-
  navigation/focus-management/Tab-order pass across Modal/Drawer/Toast
  hasn't been done.
- Integration/workflow tests: Login → Dashboard → Student → Enrollment →
  Recognition → History → Reports → Analytics → Settings → Logout, with
  every backend call mocked, is a substantial test-harness effort (shared
  router + auth-context test wrapper, MSW or manual fetch mocks) that
  hasn't been started.

## 🚧 Frontend Automated Tests — IN PROGRESS (batch 2: more utils + Modal/Toast)

Continuing from the previous batch (utils + a few shared components, 96
tests). Same scope note applies: a request came in asking to mark this
module COMPLETE and treat the "explicitly still open" list as empty. It
isn't — see the honest remainder below, unchanged in kind from last batch,
just shorter.

**New this batch, verified by actually running `npx vitest run`**:
- `csvParser.test.js` — the hand-rolled RFC 4180 parser used by the CSV
  import wizard: quoted fields containing commas/newlines, doubled-quote
  escaping, CRLF vs LF, no-trailing-newline, blank-line dropping; plus
  `rowsToObjects`' header-alias normalization (case/spacing-insensitive)
  and missing-trailing-cell handling.
- `reportFormatter.test.js` — every exported function, including the
  `formatReportDateRange` fallback wiring that was a documented gap fixed
  in the Reports Module batch (dead code until then).
- `analyticsExport.test.js` — CSV/JSON export for records and summaries
  (including the empty-input no-op case), and `exportAsPdf`'s window.print
  call (verifying it's the documented print-stand-in, not a fabricated PDF
  library call).
- `chartTheme.test.js` — light shape guard on `CHART_COLORS`/`CHART_MARGIN`
  so a future edit can't silently drop a key a chart depends on.
- `Modal.test.jsx` — open/closed rendering, Escape-to-close, close button,
  aria-modal/aria-label, and listener cleanup on unmount (no stale Escape
  handler firing after the component is gone).
- `Toast.test.jsx` — success/error variants, manual dismiss, multiple
  simultaneous toasts, auto-dismiss timing via fake timers, duration:0
  never auto-dismissing, and the outside-provider error from `useToast`.

**Two real test bugs caught and fixed before calling this batch done** (in
the new tests themselves, not in application code — no feature was
touched): the auto-dismiss tests originally mixed `userEvent`'s async click
with `vi.useFakeTimers()`, which timed out (`userEvent` schedules its own
internal timers that fake-timers starves) and then read stale DOM (the
timer-driven `dismiss()` call's `setState` never flushed because it wasn't
wrapped in `act()`). Fixed by switching those two tests to `fireEvent.click`
(synchronous, RTL-wraps in `act()` automatically) and explicitly wrapping
`vi.advanceTimersByTime()` in `act()` so the resulting state update
flushes before the assertion. Re-ran the full suite after the fix rather
than trusting the diff.

**Test infra change**: added a `URL.createObjectURL`/`revokeObjectURL`
stub to `src/test/setup.js`, guarded the same way as the existing
mediaDevices/matchMedia stubs (`if (!URL.createObjectURL)`), since jsdom
doesn't implement Blob URL creation and `analyticsExport.test.js` needed it
to spy on the CSV/JSON download flow without it throwing.

**Running total across both batches: 18 test files, 147 tests, all
passing** (verified in this sandbox both times, not assumed).

**Explicitly still open** (same categories as last batch, now smaller):
- Page-level tests: LoginPage, AdminDashboardPage/StaffDashboardPage,
  StudentsListPage + StudentDetailPage, RecognitionPage +
  RecognitionHistoryPage, AnalyticsPage, ReportsPage, NotificationsPage,
  HelpPage, AboutPage, SettingsPage, UserManagementPage.
- Remaining components not yet covered: RecognitionEventCard,
  RecognitionTimeline, RecognitionStatistics, RecognitionFilters,
  RecognitionSessionPanel, StudentForm, StudentCsvImportWizard,
  StudentProfileDrawer, Drawer, Heatmap/RecognitionHeatmap,
  RecognitionLatencyChart, ConfidenceDistributionChart,
  AnalyticsFilterPanel, AdvancedStatsCards, ReportBuilder,
  ReportExportMenu, ReportSection, ReportMetricGrid, ReportCover,
  ReportSignature, NotificationCard, NotificationList,
  NotificationDrawer, Skeleton (low priority -- purely presentational,
  no logic to break), ScanFrame.
- API-layer tests: no API module has mocked-request tests yet (authApi,
  studentApi, recognitionApi, analyticsApi, reportsApi, userApi).
- Context/hook tests: AuthContext, ThemeContext (if present),
  NotificationContext's polling lifecycle, useSavedFilterPresets.
- Routing tests: ProtectedRoute/RoleRoute redirect behavior, 404 page,
  nested DashboardLayout rendering.
- Dedicated accessibility pass and full login→logout integration test:
  not started -- these need a shared test-wrapper (router + auth context +
  mocked API layer) built once and reused, which is worth doing
  deliberately as its own step rather than folded into this batch.

## 🚧 Frontend Automated Tests — IN PROGRESS (batch 3: auth/routing layer + Recognition module)

Same standing scope note as the last two batches: instructions keep
arriving asking to declare this module COMPLETE and the open-items list
empty. Still isn't true. Also, some of those instructions named Help
components that don't exist in this codebase (`HelpSearch`, `HelpSidebar`,
`HelpNavigation`, `HelpArticle`) -- the Help Module is just `HelpPage.jsx`
plus `FaqItem`/`FaqSection` (see the Help/About batch). Verified against
the actual `src/components/help` directory before writing anything rather
than inventing files to match names that don't correspond to real code.

**New this batch, verified by running `npx vitest run`** (28 test files,
201 tests, all passing):

*Shared test infra*:
- `src/test/testUtils.jsx` -- `renderWithRouter` (MemoryRouter wrapper,
  accepts either a path string or a `{ pathname, state }` object so
  location-state-dependent behavior like LoginPage's post-login redirect
  is actually testable) and `mockAuthValue`/`mockAdminUser`/`mockStaffUser`
  factories, so route/page tests stop each re-declaring the same
  `useAuth()` mock shape.

*Auth/routing layer*:
- `authApi.test.js` -- mocks `axiosClient`, verifies each function
  (login/refresh/logout/changePassword) hits the right endpoint with the
  right body and unwraps `res.data`; verifies login's rejection isn't
  swallowed.
- `AuthContext.test.jsx` -- the real lifecycle: initializing → session
  rehydration via silent refresh + profile fetch (success and failure
  paths), login success (stores token+user), login failure (surfaces the
  server's error message), logout (clears session even when the server
  call itself fails), and the outside-provider error. Mocks
  `authApi`/`profileApi`/`axiosClient` so no real HTTP call happens.
- `LoginPage.test.jsx` -- mocks `useAuth` directly (not the full provider,
  to isolate the page) and `useNavigate`: field rendering, error alert
  display, successful submit navigating to `/` or back to the originally-
  requested page (via location.state.from), no navigation on a rejected
  login, and the submitting/loading button state.
- `ProtectedRoute.test.jsx` -- all three states (initializing spinner,
  unauthenticated redirect to `/login`, authenticated pass-through),
  rendered inside real `<Routes>` so the redirect is verified end-to-end,
  not just by return-value inspection.
- `RoleRoute.test.jsx` -- allowed role passes through, disallowed role and
  no-user-at-all both redirect to `/unauthorized`.

*Recognition module* (ConfidenceMeter already covered in batch 1):
- `RecognitionEventCard.test.jsx` -- compact vs. full render modes,
  expand/collapse toggle and its `aria-expanded` state, the
  "Unrecognized"/"Unrecognized face" fallback text (different wording
  between the two modes -- both verified), missing-duration/register-number
  placeholders.
- `RecognitionTimeline.test.jsx` -- loading skeleton, empty state with a
  custom message, null-records treated as empty (not an error), and a
  rendered list using real `listitem` semantics.
- `RecognitionStatistics.test.jsx` -- total/successful/failed counts,
  average confidence across all records regardless of status, average
  duration computed only over records that actually have one, and the
  today-vs-week split using real relative dates (not frozen fake time,
  since the component reads `Date.now()` directly).
- `RecognitionFilters.test.jsx` -- every control's current value, onChange
  patches for text/select inputs, the full status option list, and the
  reset button.
- `RecognitionSessionPanel.test.jsx` -- active/paused label and button
  swap, the recognition-count passthrough, the elapsed-timer tick via fake
  timers (verified it does NOT tick while paused), and End Session
  resetting the visible timer to 00:00.

**One real defect found and fixed, in production code, exposed by writing
a test** (permitted per this batch's "fix genuine bugs" instruction):
`RecognitionFilters.jsx` had zero `htmlFor`/`id` association between any
of its seven `<label>`/input pairs -- confirmed by reading the source, not
guessed. That's a real accessibility gap (a screen reader announces those
inputs with no label at all), not just a test-authoring inconvenience.
Fixed by adding matching `id`/`htmlFor` pairs to all seven, using the same
pattern already established in `LoginPage.jsx`. No visual or behavioral
change -- purely additive attributes.

**Two real bugs caught in the new tests themselves** (not app code) before
calling this batch done, same "fake timers + userEvent don't mix" and
"ambiguous text query" classes as previous batches -- re-verified by
re-running the full suite after each fix, not assumed fixed:
1. `RecognitionEventCard.test.jsx` asserted `getByText('92.0%')`, but that
   confidence percentage legitimately renders twice (once inside
   `ConfidenceMeter`, once in the `dl` summary below it) -- `getByText`
   throws on multiple matches by design. Fixed with `getAllByText(...)`
   asserting length 2.
2. `RecognitionSessionPanel.test.jsx`'s "End Session resets timer" test
   mixed `userEvent`'s async click with `vi.useFakeTimers()` and timed out
   (same root cause as the earlier Toast bug). Fixed by switching to
   `fireEvent.click` (synchronous, RTL-`act`-wrapped).

**Running total across three batches: 28 test files, 201 tests, all
passing**, verified in this sandbox after every fix, not just after
writing.

**Explicitly still open** (narrower than last batch; same categories):
- Student module: StudentForm, StudentCsvImportWizard, StudentProfileDrawer.
- Analytics module: Histogram, Heatmap (generic ui component),
  RecognitionHeatmap, RecognitionLatencyChart, ConfidenceDistributionChart,
  AnalyticsFilterPanel, AdvancedStatsCards.
- Reports module: ReportBuilder, ReportExportMenu, ReportSection,
  ReportMetricGrid, ReportCover, ReportSignature, ReportLoadingSkeleton,
  ReportEmptyState, ReportErrorState.
- Notifications module: NotificationCard, NotificationList,
  NotificationDrawer, and the `NotificationContext` polling lifecycle
  itself (setInterval gating, visibility pause/resume, overlap prevention
  -- described but not yet test-verified).
- Remaining shared UI: Drawer, Skeleton (low priority, no real logic),
  ScanFrame.
- Remaining hooks: `useSavedFilterPresets`.
- Page-level tests: every dashboard/list/detail page not yet covered
  (AdminDashboardPage, StaffDashboardPage, StudentsListPage,
  RecognitionPage, AnalyticsPage, ReportsPage, NotificationsPage,
  HelpPage, AboutPage, SettingsPage, UserManagementPage).
- Remaining API modules: studentApi, recognitionApi, analyticsApi,
  reportsApi, userApi, settingsApi, systemHealthApi.
- Full login→logout integration test spanning every module.
- `TESTING_SUMMARY.md` has not been generated -- premature until there's
  an actual finished suite to summarize; generating it now would
  misrepresent partial coverage as complete.

## ⚠️ Backend: real security-test bug found and fixed (not just an assertion tweak)

Your own `mvn clean test` run surfaced something more serious than a
regular test failure: `UserControllerSecurityTest.staffCannotCreateUsers`
and `staffIsForbiddenFromListingUsers` both got `201`/`200` where they
expected `403`. Root cause, confirmed by reading the actual filter list
Spring printed in your log rather than guessed: `@WebMvcTest(UserController.class)`
never actually loaded `SecurityConfig` -- the class holding the real
`/users/** -> hasRole("ADMIN")` rule. `@WebMvcTest`'s slice only
auto-includes `JwtAuthFilter` because it happens to *also* be a raw
`Filter` bean (Spring Boot registers any `Filter` bean it finds into
MockMvc, independent of Spring Security's own chain) -- but `SecurityConfig`
itself is a plain `@Configuration` class that the slice does **not** pick
up on its own. Left unimported, Spring Boot silently fell back to its own
default auto-configured security (any authenticated user allowed, no role
check at all) -- the tell-tale sign, visible in your own log, is the
`Using generated security password: ...` line, which only ever appears
when no custom `SecurityFilterChain` bean was found. That means these two
tests were "passing" (well, one had been failing to even load) against a
phantom default chain, not the real authorization rule, this whole time.

**Fixed** by adding `@Import({ SecurityConfig.class,
JwtAuthenticationEntryPoint.class, RoleBasedAccessDeniedHandler.class })`
to the test class. The latter two are `SecurityConfig`'s own
`@Autowired` collaborators (confirmed both have zero dependencies of their
own, so they're imported as real beans, not mocked -- we want the actual
401/403 JSON bodies they produce, not mock no-ops). This should make the
real rule finally get exercised. **Not yet re-verified by an actual
`mvn test` run** -- this sandbox still can't compile/run Java; the next
`mvn clean test` you run is the real check.

## Next batch starting point
Student module next (StudentForm/StudentCsvImportWizard/
StudentProfileDrawer), since it reuses `studentValidation.js` and
`csvParser.js` (both already tested) and is a natural next step before
Analytics' heavier chart components. Re-run `npx vitest run` after every
addition.

