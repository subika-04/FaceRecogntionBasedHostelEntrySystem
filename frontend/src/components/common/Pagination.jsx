// Expects a Spring Data Page<T> shape: { number, totalPages, totalElements, size }
export default function Pagination({ page, onPageChange }) {
  if (!page || page.totalPages <= 1) return null;

  const current = page.number; // 0-indexed
  const total = page.totalPages;

  const pages = [];
  const start = Math.max(0, current - 2);
  const end = Math.min(total - 1, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
      <span className="text-slate-500 dark:text-slate-400">
        Showing page {current + 1} of {total} · {page.totalElements} total
      </span>
      <div className="flex items-center gap-1">
        <button
          className="btn-secondary px-2 py-1"
          disabled={current === 0}
          onClick={() => onPageChange(current - 1)}
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-lg px-3 py-1 ${
              p === current ? 'bg-brand-gradient text-white shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {p + 1}
          </button>
        ))}
        <button
          className="btn-secondary px-2 py-1"
          disabled={current >= total - 1}
          onClick={() => onPageChange(current + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
