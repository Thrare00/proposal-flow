import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DASHBOARD_HORIZONS, bucketProposalsByHorizon, daysUntilDate } from '../lib/pursuitTiming.js';
import { getStatusName } from '../utils/statusUtils.js';

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CaptureTimeline({ proposals }) {
  const [expandedId, setExpandedId] = useState(null);

  const { buckets } = useMemo(
    () => bucketProposalsByHorizon(proposals.filter((p) => p.status !== 'closed' && p.status !== 'submitted')),
    [proposals],
  );

  const horizonsWithData = DASHBOARD_HORIZONS.filter((h) => buckets[h.id]?.length > 0);

  if (horizonsWithData.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Capture Timeline</h2>
        <p className="mt-2 text-sm text-gray-500">No active opportunities with due dates to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Capture Timeline</h2>
      <div className="space-y-2">
        {DASHBOARD_HORIZONS.map((horizon) => {
          const items = buckets[horizon.id] || [];
          if (items.length === 0) return null;
          const isExpanded = expandedId === horizon.id;
          return (
            <div key={horizon.id} className={`rounded-lg border ${horizon.tone} overflow-hidden`}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : horizon.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left"
              >
                <span className="font-semibold text-sm">{horizon.label}</span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="font-bold">{items.length}</span>
                  <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
                </span>
              </button>
              {isExpanded && (
                <div className="border-t border-current/10 bg-white/60 divide-y divide-current/5">
                  {items
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .map((p) => {
                      const days = daysUntilDate(p.dueDate);
                      return (
                        <Link key={p.id} to={`/proposals/${p.id}`} className="block px-3 py-2 hover:bg-white/80 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                              <p className="text-xs text-gray-600">{p.agency || 'No agency'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-medium text-gray-700">{formatDate(p.dueDate)}</p>
                              <p className="text-xs text-gray-500">
                                {days !== null ? (days === 0 ? 'Today' : days < 0 ? `${Math.abs(days)}d ago` : `${days}d`) : '—'}
                                {' · '}
                                {getStatusName(p.status)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
