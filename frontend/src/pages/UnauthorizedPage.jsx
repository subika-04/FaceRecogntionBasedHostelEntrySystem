import { Link } from 'react-router-dom';
import RestrictedIllustration from '../illustrations/RestrictedIllustration';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 py-12 text-center dark:bg-ink">
      <RestrictedIllustration />
      <p className="font-id text-xs uppercase tracking-widest text-denied-500">Error 403</p>
      <h1 className="font-display text-xl font-semibold text-ink dark:text-slate-100 sm:text-2xl">
        Access restricted
      </h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Your account role doesn't have permission to view this page. This
        area is restricted to Administrators.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
