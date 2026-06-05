import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { daysUntilDate } from '../lib/pursuitTiming.js';
import { getStatusName } from '../utils/statusUtils.js';

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function urgencyTag(days) {
  if (days === null) return null;
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: 'bg-red-600 text-white' };
  if (days === 0) return { text: 'Due today', cls: 'bg-red-500 text-white' };
  if (days <= 2) return { text: `${days}d left`, cls: 'bg-red-100 text-red-800' };
  if (days <= 7) return { text: `${days}d left`, cls: 'bg-orange-100 text-orange-800' };
  return { text: `${days}d left`, cls: 'bg-amber-100 text-amber-800' };
}

export default function MustSubmitPanel({ proposals }) {
  const mustSubmit = useMemo(() => {
    const terminal = ['submitted', 'closed'];
    return proposals
      .filter((p) => {
        if (terminal.includes(p.status)) return false;
        const days = daysUntilDate(p.dueDate);
        return days !== null && days <= 14;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [proposals]);

  if (mustSubmit.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-900">Must Submit</h2>
        <p className="mt-2 text-sm text-emerald-800">Nothing due in the next 14 days. Pipeline is clear.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-red-900">Must Submit</h2>
        <span className="text-xs font-bold rounded-full bg-red-100 text-red-800 px-2 py-0.5">{mustSubmit.length}</span>
      </div>
      <div className="space-y-2">
        {mustSubmit.map((p) => {
          const days = daysUntilDate(p.dueDate);
          const tag = urgencyTag(days);
          return (
            <Link key={p.id} to={`/proposals/${p.id}`} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{p.agency || 'No agency'} · {getStatusName(p.status)}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  {tag && <span className={`inline-block text-xs font-bold rounded-full px-2 py-0.5 ${tag.cls}`}>{tag.text}</span>}
                  <p className="text-xs text-gray-500">{formatDate(p.dueDate)}</p>
                </div>
              </div>
              {p.solicitation_number && <p className="text-xs text-gray-500 mt-1">{p.solicitation_number}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
