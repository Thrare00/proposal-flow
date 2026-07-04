import { useState, useMemo, useCallback, useEffect } from 'react';
import { Award, Plus, Search, X, BookOpen, AlertTriangle, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import PastPerformanceForm from '../components/pastperf/PastPerformanceForm.jsx';
import PastPerformanceCard from '../components/pastperf/PastPerformanceCard.jsx';
import { parseTags, isOurs, OWNER_DEFAULT } from '../components/pastperf/constants.js';
import {
  getPastPerformanceRecords,
  createPastPerformanceRecord,
  updatePastPerformanceRecord,
  deletePastPerformanceRecord,
} from '../components/pastperf/api.js';

const OWNER_FILTERS = [
  { key: 'ours', label: 'Ours' },
  { key: 'partners', label: 'Partners' },
  { key: 'all', label: 'All' },
];

const HEADER_PROPS = {
  title: 'Past Performance',
  subtitle: 'A reusable library of past-performance records to cite across bids.',
  icon: Award,
};

export default function PastPerformanceLibrary() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [activeNaics, setActiveNaics] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState('ours');

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getPastPerformanceRecords()
      .then((data) => {
        if (cancelled) return;
        setRecords(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.message || 'Failed to load past-performance records from the server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  const ownerFilteredRecords = useMemo(() => {
    if (ownerFilter === 'all') return records;
    if (ownerFilter === 'partners') return records.filter((r) => !isOurs(r));
    return records.filter((r) => isOurs(r));
  }, [records, ownerFilter]);

  const allNaics = useMemo(() => {
    const set = new Set(ownerFilteredRecords.map((r) => r.naics).filter(Boolean));
    return Array.from(set).sort();
  }, [ownerFilteredRecords]);

  const allTags = useMemo(() => {
    const set = new Set();
    ownerFilteredRecords.forEach((r) => (Array.isArray(r.tags) ? r.tags : []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [ownerFilteredRecords]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ownerFilteredRecords.filter((r) => {
      if (activeNaics && r.naics !== activeNaics) return false;
      if (activeTag && !(Array.isArray(r.tags) && r.tags.includes(activeTag))) return false;
      if (!term) return true;
      const haystack = `${r.contractName || ''} ${r.agency || ''} ${r.relevanceBlurb || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [ownerFilteredRecords, search, activeNaics, activeTag]);

  const hasActiveFilters = Boolean(search || activeNaics || activeTag);

  const openAddForm = useCallback(() => {
    setEditingRecord(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((record) => {
    setEditingRecord({
      ...record,
      value: record.value ?? '',
      owner: record.owner || OWNER_DEFAULT,
      tags: Array.isArray(record.tags) ? record.tags.join(', ') : record.tags || '',
    });
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingRecord(null);
  }, []);

  const handleSave = useCallback(
    async (formData) => {
      const payload = {
        ...formData,
        tags: parseTags(formData.tags),
        owner: (formData.owner || '').trim() || OWNER_DEFAULT,
      };

      setActionError(null);

      try {
        if (editingRecord && editingRecord.id) {
          const result = await updatePastPerformanceRecord(editingRecord.id, payload);
          const merged =
            result && typeof result === 'object' && !Array.isArray(result)
              ? { ...payload, ...result, id: editingRecord.id }
              : { ...payload, id: editingRecord.id };
          setRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? merged : r)));
        } else {
          const result = await createPastPerformanceRecord(payload);
          if (!result || typeof result !== 'object' || !result.id) {
            throw new Error('Server did not return a valid record id when creating the record.');
          }
          setRecords((prev) => [result, ...prev]);
        }
        closeForm();
      } catch (err) {
        setActionError(err?.message || 'Failed to save the record on the server.');
      }
    },
    [editingRecord, closeForm]
  );

  const handleDelete = useCallback(async (id) => {
    let removed;
    setRecords((prev) => {
      removed = prev.find((r) => r.id === id);
      return prev.filter((r) => r.id !== id);
    });
    setActionError(null);
    try {
      await deletePastPerformanceRecord(id);
    } catch (err) {
      setActionError(err?.message || 'Failed to delete record on the server.');
      setRecords((prev) => (removed ? [removed, ...prev] : prev));
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setActiveNaics(null);
    setActiveTag(null);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-4">
        <PageHeader {...HEADER_PROPS} />
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-rare-crimson" />
          <p className="font-rare-sans text-sm text-rare-gray dark:text-rare-cream/70">
            Loading past-performance records...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl p-4">
        <PageHeader {...HEADER_PROPS} />
        <div className="bg-rare-crimson/10 border-l-4 border-rare-crimson p-4 rounded-md flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rare-crimson shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-rare-crimson">
              Couldn&apos;t load past-performance records from the server.
            </p>
            <p className="text-sm text-rare-crimson/80 mt-1 break-words">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 text-sm font-rare-sans font-medium text-rare-crimson hover:text-rare-crimson-dark transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <PageHeader
        {...HEADER_PROPS}
        actions={
          <button
            type="button"
            onClick={openAddForm}
            className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Past Performance
          </button>
        }
      />

      {actionError && (
        <div className="mb-4 bg-rare-crimson/10 border-l-4 border-rare-crimson p-3 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-rare-crimson shrink-0 mt-0.5" />
          <p className="text-sm text-rare-crimson flex-1 break-words">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rare-crimson hover:text-rare-crimson-dark transition-colors shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-rare-sans font-medium text-rare-gray dark:text-rare-cream/60">
          Owner:
        </span>
        {OWNER_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setOwnerFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-rare-sans font-medium border transition-colors ${
              ownerFilter === key
                ? 'border-rare-crimson text-rare-crimson bg-rare-crimson/5'
                : 'border-rare-gray/30 text-rare-gray dark:text-rare-cream/70 hover:border-rare-crimson/40 hover:text-rare-crimson'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <PastPerformanceForm initialData={editingRecord} onSave={handleSave} onCancel={closeForm} />
      )}

      {records.length > 0 && (
        <div className="mb-5 flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rare-gray" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contract, agency, or relevance..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-rare-gray/30 bg-white dark:bg-rare-ink dark:text-rare-cream text-sm font-rare-sans focus:outline-none focus:ring-2 focus:ring-rare-crimson/40"
            />
          </div>

          {(allNaics.length > 0 || allTags.length > 0) && (
            <div className="flex flex-col gap-2">
              {allNaics.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-rare-sans font-medium text-rare-gray dark:text-rare-cream/60">
                    NAICS:
                  </span>
                  {allNaics.map((naics) => (
                    <button
                      key={naics}
                      type="button"
                      onClick={() => setActiveNaics((prev) => (prev === naics ? null : naics))}
                      className={`px-2.5 py-1 rounded-full text-xs font-rare-sans transition-colors ${
                        activeNaics === naics
                          ? 'bg-rare-crimson text-white'
                          : 'bg-rare-gray-light dark:bg-white/10 text-rare-ink dark:text-rare-cream/80 hover:bg-rare-gray/20'
                      }`}
                    >
                      {naics}
                    </button>
                  ))}
                </div>
              )}

              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-rare-sans font-medium text-rare-gray dark:text-rare-cream/60">
                    Tags:
                  </span>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                      className={`px-2.5 py-1 rounded-full text-xs font-rare-sans transition-colors ${
                        activeTag === tag
                          ? 'bg-rare-crimson text-white'
                          : 'bg-rare-gray-light dark:bg-white/10 text-rare-ink dark:text-rare-cream/80 hover:bg-rare-gray/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 self-start text-xs font-rare-sans text-rare-gray hover:text-rare-crimson transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center bg-white/95 dark:bg-rare-ink shadow-card rounded-xl">
          <BookOpen className="w-8 h-8 text-rare-gray dark:text-rare-cream/50" strokeWidth={1.5} />
          <p className="font-rare-sans text-sm text-rare-gray dark:text-rare-cream/70 max-w-sm">
            No past-performance records yet — add your first to reuse across bids.
          </p>
          <button
            type="button"
            onClick={openAddForm}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm mt-1"
          >
            <Plus className="w-4 h-4" />
            Add Past Performance
          </button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center bg-white/95 dark:bg-rare-ink shadow-card rounded-xl">
          <Search className="w-6 h-6 text-rare-gray dark:text-rare-cream/50" />
          <p className="font-rare-sans text-sm text-rare-gray dark:text-rare-cream/70">
            No records match your search or filters.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-rare-sans text-rare-crimson hover:text-rare-crimson-dark transition-colors"
            >
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOwnerFilter('all')}
              className="text-sm font-rare-sans text-rare-crimson hover:text-rare-crimson-dark transition-colors"
            >
              Show all owners
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => (
            <PastPerformanceCard
              key={record.id}
              record={record}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
