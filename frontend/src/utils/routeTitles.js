// Route -> page title map, mirroring the `handle.title` values previously
// declared on each <Route> in App.jsx.
//
// NOTE: useMatches()/handle only work with a React Router *data router*
// (createBrowserRouter + RouterProvider). This app uses the classic
// <BrowserRouter>/<Routes> API, so titles are resolved here with
// matchPath() instead.
export const ROUTE_TITLES = [
  { path: '/', title: 'Dashboard' },
  { path: '/students', title: 'Students' },
  { path: '/students/new', title: 'Register Student' },
  { path: '/students/:id', title: 'Student Details' },
  { path: '/recognition/live', title: 'Live Recognition' },
  { path: '/recognition/history', title: 'Recognition History' },
  { path: '/profile', title: 'My Profile' },
  { path: '/change-password', title: 'Change Password' },
  { path: '/help', title: 'Help' },
  { path: '/about', title: 'About' },
  { path: '/analytics', title: 'Analytics' },
  { path: '/settings', title: 'System Settings' },
  { path: '/reports', title: 'Reports' },
  { path: '/users', title: 'User Management' },
];
