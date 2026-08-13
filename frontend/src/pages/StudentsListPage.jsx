import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as studentApi from '../api/studentApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ROLES } from '../utils/constants';
import { downloadCsv } from '../utils/csvExport';
import StudentTable from '../components/students/StudentTable';
import StudentCsvImportWizard from '../components/students/StudentCsvImportWizard';
import StudentProfileDrawer from '../components/students/StudentProfileDrawer';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';

const CSV_COLUMNS = [
  { label: 'Register Number', value: 'registerNumber' },
  { label: 'Full Name', value: 'fullName' },
  { label: 'Department', value: 'department' },
  { label: 'Year', value: 'year' },
  { label: 'Hostel Status', value: 'hostelStatus' },
  { label: 'Enrollment Status', value: 'enrollmentStatus' },
  { label: 'Registered By', value: 'registeredByUsername' },
];

export default function StudentsListPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState(null);

  const load = async (currentPage = pageIndex, currentQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentApi.searchStudents({
        query: currentQuery || undefined,
        page: currentPage,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      setPage(data);
      setSelectedIds(new Set()); // selections don't carry across a reload/page change
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load students.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPageIndex(0);
    load(0, query);
  };

  const handlePageChange = (p) => {
    setPageIndex(p);
    load(p, query);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await studentApi.deleteStudent(pendingDelete.id);
      setPendingDelete(null);
      toast.success(`${pendingDelete.fullName} was removed.`);
      load(pageIndex, query);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete student.'));
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids, select) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(ids.map((id) => studentApi.deleteStudent(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkDeleting(false);
    setBulkDeleteOpen(false);

    if (failed === 0) {
      toast.success(`${ids.length} student${ids.length === 1 ? '' : 's'} removed.`);
    } else {
      toast.error(`${failed} of ${ids.length} could not be removed. The rest were.`);
    }
    load(pageIndex, query);
  };

  const handleExportCsv = () => {
    downloadCsv(`students-page-${pageIndex + 1}.csv`, page?.content || [], CSV_COLUMNS);
    toast.info('CSV downloaded for the students currently shown. For a full filtered export, use Reports.');
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2">
          <input
            className="input"
            placeholder="Search by name or register number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-secondary shrink-0">
            Search
          </button>
        </form>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn-secondary" onClick={handleExportCsv} disabled={!page?.content?.length}>
            Export CSV
          </button>
          <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
            Import CSV
          </button>
          <Link to="/students/new" className="btn-primary">
            + Register Student
          </Link>
        </div>
      </div>

      {isAdmin && selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-brass-200 bg-brass-50 px-4 py-2 text-sm">
          <span className="font-medium text-brass-700">
            {selectedCount} student{selectedCount === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <button className="text-slate-500 hover:underline" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
            <button className="font-medium text-denied-600 hover:underline" onClick={() => setBulkDeleteOpen(true)}>
              Delete selected
            </button>
          </div>
        </div>
      )}

      <ErrorMessage message={error} onRetry={() => load(pageIndex, query)} />

      <div className="card">
        {loading ? (
          <SkeletonTable columns={6} />
        ) : page?.content?.length ? (
          <>
            <StudentTable
              students={page.content}
              onDelete={setPendingDelete}
              onQuickView={setQuickViewId}
              selectedIds={isAdmin ? selectedIds : undefined}
              onToggleSelect={isAdmin ? toggleSelect : undefined}
              onToggleSelectAll={isAdmin ? toggleSelectAll : undefined}
            />
            <Pagination page={page} onPageChange={handlePageChange} />
          </>
        ) : (
          <EmptyState
            title="No students found"
            description={query ? 'Try a different name or register number.' : 'Register your first student to get started.'}
            action={!query && <Link to="/students/new" className="btn-primary">+ Register Student</Link>}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete student"
        message={`This will permanently remove ${pendingDelete?.fullName} and their face embeddings. This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        confirming={deleting}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedCount} student${selectedCount === 1 ? '' : 's'}`}
        message="This will permanently remove every selected student and their face embeddings. This cannot be undone."
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        confirming={bulkDeleting}
        confirmLabel="Delete all"
        confirmingLabel="Deleting…"
      />

      <StudentCsvImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportStart={() => toast.info('Import started…')}
        onImportFinished={({ successCount, duplicateCount, failedCount, cancelled }) => {
          if (cancelled) {
            toast.info(`Import cancelled. ${successCount} student${successCount === 1 ? '' : 's'} were imported before stopping.`);
          } else if (failedCount === 0 && duplicateCount === 0) {
            toast.success(`Import complete: ${successCount} student${successCount === 1 ? '' : 's'} added.`);
          } else {
            toast.error(
              `Import finished with issues: ${successCount} added, ${duplicateCount} duplicate(s) skipped, ${failedCount} failed. See the failure report for details.`
            );
          }
        }}
        onImported={() => load(pageIndex, query)}
      />

      <StudentProfileDrawer
        studentId={quickViewId}
        open={!!quickViewId}
        onClose={() => setQuickViewId(null)}
      />
    </div>
  );
}
