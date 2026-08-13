import { ROLES } from './constants';

// Pure data module for the Help page. Each entry's `roles` restricts which
// signed-in role sees it (omit `roles` entirely for content relevant to
// everyone). Kept separate from HelpPage.jsx so the content can grow
// without touching component code, and so FaqSection/FaqItem stay generic
// renderers with zero knowledge of what a hostel entry system's FAQ
// actually says.
export const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '◧',
    questions: [
      {
        q: 'What can I do from the Dashboard?',
        a: 'The Dashboard gives a role-appropriate snapshot of the system — recent recognition activity and quick links for staff, plus system-wide summary cards for admins. It refreshes the same data the Analytics module uses, so the numbers always match.',
      },
      {
        q: 'What is the difference between a Staff and an Admin account?',
        a: 'Staff can register and manage students, run live recognition, and browse recognition history. Admins get everything Staff has, plus Analytics, printable Reports, User Management, and System Settings. Sidebar links you don\u2019t have access to simply won\u2019t appear.',
      },
      {
        q: 'Can I use the system on a phone or tablet?',
        a: 'Yes, layouts are responsive down to mobile widths. The sidebar collapses on narrow screens; live camera capture still needs a device with a working camera and browser camera permission granted.',
      },
    ],
  },
  {
    id: 'students',
    title: 'Students & Enrollment',
    icon: '◎',
    questions: [
      {
        q: 'How do I register a new student?',
        a: 'Go to Students → Register Student, fill in the required fields, then complete face enrollment by capturing five poses in sequence: straight, left, right, up, and down. All five are required before the student\u2019s status moves from PENDING to ENROLLED.',
      },
      {
        q: 'Why did a student\u2019s enrollment fail?',
        a: 'Enrollment fails if any of the five required pose captures wasn\u2019t accepted (usually poor lighting, an obstructed face, or the camera being too far away). Open the student\u2019s profile and retry enrollment \u2014 previously accepted poses don\u2019t need to be redone if they were already saved.',
      },
      {
        q: 'Can I import many students at once?',
        a: 'Yes \u2014 use the CSV import wizard from the Students page. It walks through Upload, Preview, Import, and Summary steps, validates each row with the same rules as the manual registration form, and lets you download a starter template before you begin.',
      },
      {
        q: 'What\u2019s the difference between Hosteller and Day Scholar status?',
        a: 'This is just a classification field on the student record (used for filtering and reporting) \u2014 it doesn\u2019t change how recognition or enrollment works.',
      },
    ],
  },
  {
    id: 'recognition',
    title: 'Live Recognition',
    icon: '◉',
    questions: [
      {
        q: 'What do MATCHED, UNKNOWN, and LOW_CONFIDENCE mean?',
        a: 'MATCHED means the captured face was matched to an enrolled student above the configured confidence threshold. LOW_CONFIDENCE means a possible match was found but it fell below that threshold. UNKNOWN means no enrolled student matched at all.',
      },
      {
        q: 'Who sets the recognition confidence threshold?',
        a: 'An Admin sets it from System Settings. Raising it reduces false matches but increases LOW_CONFIDENCE results; lowering it does the reverse. Changes apply to recognition attempts going forward, not retroactively to past history.',
      },
      {
        q: 'The camera feed isn\u2019t showing anything \u2014 what should I check?',
        a: 'Confirm your browser has been granted camera permission for this site, that no other application is currently using the camera, and that you selected the correct camera source if more than one is registered. A blank frame with no error usually means the permission prompt was dismissed.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: '🔔',
    questions: [
      {
        q: 'How often do notifications update?',
        a: 'The bell icon polls automatically in the background while you\u2019re signed in. Polling pauses while the browser tab is in the background and immediately checks again the moment you switch back to it, so you won\u2019t miss anything or waste requests.',
      },
      {
        q: 'Why don\u2019t I see security/account notifications?',
        a: 'Account-lockout notifications are Admin-only, since they come from the user management endpoint that only Admin accounts can query. Staff accounts see recognition, enrollment, and system-health notifications instead.',
      },
    ],
  },
  {
    id: 'analytics-reports',
    title: 'Analytics & Reports',
    icon: '◫',
    roles: [ROLES.ADMIN],
    questions: [
      {
        q: 'Where does the Analytics data come from?',
        a: 'Charts and the advanced statistics cards are computed client-side over a shared sample of recent recognition activity, so every panel on the page stays consistent with the others. Filters narrow that already-loaded sample rather than re-querying the server each time \u2014 this is called out on-screen wherever it applies.',
      },
      {
        q: 'What\u2019s the difference between exporting from Analytics and exporting a Report?',
        a: 'Analytics exports (CSV/JSON) cover the filtered sample currently loaded on screen. The three Reports-page report cards (Recognition History, Student Directory, Activity Logs) query the complete dataset on the backend, so use those when you need an exhaustive export rather than a sample.',
      },
      {
        q: 'Can I print or save a report as PDF?',
        a: 'Yes \u2014 open Reports, choose a template, and use the print option; the report layout is designed for clean A4 printing with running headers/footers and page numbers. Use your browser\u2019s \u201cSave as PDF\u201d destination in the print dialog to get a PDF file.',
      },
    ],
  },
  {
    id: 'account-security',
    title: 'Account & Security',
    icon: '☺',
    questions: [
      {
        q: 'How do I change my password?',
        a: 'Open your user menu (top right) → Change Password. New passwords must meet the strength policy currently configured for the system (LOW, SIMPLE, MEDIUM, or STRICT) \u2014 Admins can see and adjust that policy from System Settings.',
      },
      {
        q: 'I got signed out unexpectedly \u2014 why?',
        a: 'Your session access token expires after a fixed lifetime for security. The app tries to silently refresh it in the background; if that refresh fails (for example, the refresh token itself expired, or you cleared cookies), you\u2019ll be returned to the login screen.',
      },
      {
        q: 'Who can create or edit user accounts?',
        a: 'Only Admin accounts can access User Management to create accounts, change roles, or lock/unlock accounts.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'System Settings',
    icon: '⚙',
    roles: [ROLES.ADMIN],
    questions: [
      {
        q: 'What does each system setting control?',
        a: 'Recognition Threshold sets the minimum confidence to accept a match. Camera Sources is the JSON list of registered cameras available throughout the app. Token expiry settings control how long access and refresh sessions last. Password Policy sets the minimum strength required for new or changed passwords. Each setting shows its own description above its input field.',
      },
      {
        q: 'Do setting changes apply immediately?',
        a: 'Yes, saved settings take effect immediately for new activity. They don\u2019t retroactively change already-recorded recognition history or already-issued tokens.',
      },
    ],
  },
];

export function filterFaqByRole(categories, role) {
  return categories
    .filter((c) => !c.roles || c.roles.includes(role))
    .filter((c) => c.questions.length > 0);
}

export function searchFaq(categories, query) {
  const q = query.trim().toLowerCase();
  if (!q) return categories;
  return categories
    .map((c) => ({
      ...c,
      questions: c.questions.filter(
        (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    }))
    .filter((c) => c.questions.length > 0);
}
