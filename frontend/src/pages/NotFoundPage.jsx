import { Link } from 'react-router-dom';
import NotFoundIllustration from '../illustrations/NotFoundIllustration';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 py-12 text-center dark:bg-ink">
      <NotFoundIllustration />
      <p className="font-id text-xs uppercase tracking-widest text-brass-600">Error 404</p>
      <h1 className="font-display text-xl font-semibold text-ink dark:text-slate-100 sm:text-2xl">
        Page not found
      </h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
