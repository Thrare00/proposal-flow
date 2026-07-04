import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, Target, Briefcase, Percent, Plus, Loader2 } from 'lucide-react';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const EMPTY_ENTRY = { month: '', invoiced: '', collected: '', job_count: '' };

function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex-1 min-w-[140px] rounded-lg border border-rare-gray/20 dark:border-rare-cream/10 bg-white dark:bg-rare-ink/40 p-4 shadow-card">
      <div className="flex items-center gap-2 text-rare-gray dark:text-rare-cream/60 text-xs font-rare-sans uppercase tracking-wide">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <div className="mt-1 font-rare-serif text-2xl text-rare-ink dark:text-rare-cream">
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 text-xs font-rare-sans text-rare-gray dark:text-rare-cream/50">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

StatTile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  sub: PropTypes.node,
};

function RevenueChart({ revenue }) {
  const max = useMemo(() => {
    return revenue.reduce(
      (m, row) => Math.max(m, Number(row.invoiced) || 0, Number(row.collected) || 0),
      0
    );
  }, [revenue]);

  if (revenue.length === 0) {
    return (
      <div className="text-sm font-rare-sans text-rare-gray dark:text-rare-cream/50 py-8 text-center">
        No revenue logged yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-4 h-48 px-2 overflow-x-auto">
        {revenue.map((row) => {
          const invoiced = Number(row.invoiced) || 0;
          const collected = Number(row.collected) || 0;
          const invoicedPct = max > 0 ? (invoiced / max) * 100 : 0;
          const collectedPct = max > 0 ? (collected / max) * 100 : 0;
          return (
            <div key={row.month} className="flex flex-col items-center gap-1 min-w-[56px]">
              <div className="flex items-end gap-1 h-40">
                <div
                  className="w-4 rounded-t bg-rare-gold"
                  style={{ height: `${invoicedPct}%` }}
                  title={`Invoiced: ${currency.format(invoiced)}`}
                />
                <div
                  className="w-4 rounded-t bg-rare-lime"
                  style={{ height: `${collectedPct}%` }}
                  title={`Collected: ${currency.format(collected)}`}
                />
              </div>
              <div className="text-xs font-rare-sans text-rare-gray dark:text-rare-cream/60 whitespace-nowrap">
                {row.month}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs font-rare-sans text-rare-gray dark:text-rare-cream/60">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-rare-gold" />
          Invoiced
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-rare-lime" />
          Collected
        </div>
      </div>
    </div>
  );
}

RevenueChart.propTypes = {
  revenue: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      invoiced: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      collected: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      job_count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ).isRequired,
};

function RevenueTable({ revenue }) {
  if (revenue.length === 0) {
    return null;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-rare-gray/20 dark:border-rare-cream/10 shadow-card">
      <table className="w-full text-sm font-rare-sans">
        <thead>
          <tr className="bg-rare-gray/5 dark:bg-rare-cream/5 text-left text-rare-gray dark:text-rare-cream/60">
            <th className="px-3 py-2 font-medium">Month</th>
            <th className="px-3 py-2 font-medium text-right">Invoiced</th>
            <th className="px-3 py-2 font-medium text-right">Collected</th>
            <th className="px-3 py-2 font-medium text-right">Jobs</th>
          </tr>
        </thead>
        <tbody>
          {revenue.map((row) => (
            <tr
              key={row.month}
              className="border-t border-rare-gray/10 dark:border-rare-cream/10 text-rare-ink dark:text-rare-cream"
            >
              <td className="px-3 py-2">{row.month}</td>
              <td className="px-3 py-2 text-right">{currency.format(Number(row.invoiced) || 0)}</td>
              <td className="px-3 py-2 text-right">{currency.format(Number(row.collected) || 0)}</td>
              <td className="px-3 py-2 text-right">{row.job_count ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

RevenueTable.propTypes = {
  revenue: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      invoiced: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      collected: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      job_count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ).isRequired,
};

function AddMonthForm({ onSave }) {
  const [entry, setEntry] = useState(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => {
    setEntry((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entry.month) {
      setError('Month is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        month: entry.month,
        invoiced: Number(entry.invoiced) || 0,
        collected: Number(entry.collected) || 0,
        job_count: Number(entry.job_count) || 0,
      });
      setEntry(EMPTY_ENTRY);
    } catch (err) {
      setError(err?.message || 'Failed to save revenue entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-rare-gray/20 dark:border-rare-cream/10 bg-white dark:bg-rare-ink/40 p-4 shadow-card"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="rp-month" className="text-xs font-rare-sans text-rare-gray dark:text-rare-cream/60">
          Month
        </label>
        <input
          id="rp-month"
          type="text"
          placeholder="2026-07"
          value={entry.month}
          onChange={handleChange('month')}
          className="w-28 rounded border border-rare-gray/30 dark:border-rare-cream/20 bg-transparent px-2 py-1 text-sm text-rare-ink dark:text-rare-cream font-rare-sans"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="rp-invoiced" className="text-xs font-rare-sans text-rare-gray dark:text-rare-cream/60">
          Invoiced
        </label>
        <input
          id="rp-invoiced"
          type="number"
          step="0.01"
          placeholder="0"
          value={entry.invoiced}
          onChange={handleChange('invoiced')}
          className="w-28 rounded border border-rare-gray/30 dark:border-rare-cream/20 bg-transparent px-2 py-1 text-sm text-rare-ink dark:text-rare-cream font-rare-sans"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="rp-collected" className="text-xs font-rare-sans text-rare-gray dark:text-rare-cream/60">
          Collected
        </label>
        <input
          id="rp-collected"
          type="number"
          step="0.01"
          placeholder="0"
          value={entry.collected}
          onChange={handleChange('collected')}
          className="w-28 rounded border border-rare-gray/30 dark:border-rare-cream/20 bg-transparent px-2 py-1 text-sm text-rare-ink dark:text-rare-cream font-rare-sans"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="rp-jobs" className="text-xs font-rare-sans text-rare-gray dark:text-rare-cream/60">
          Jobs
        </label>
        <input
          id="rp-jobs"
          type="number"
          step="1"
          placeholder="0"
          value={entry.job_count}
          onChange={handleChange('job_count')}
          className="w-20 rounded border border-rare-gray/30 dark:border-rare-cream/20 bg-transparent px-2 py-1 text-sm text-rare-ink dark:text-rare-cream font-rare-sans"
        />
      </div>
      <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        Add month
      </button>
      {error ? (
        <div className="w-full text-xs font-rare-sans text-rare-crimson">{error}</div>
      ) : null}
    </form>
  );
}

AddMonthForm.propTypes = {
  onSave: PropTypes.func.isRequired,
};

export default function RevenuePanel({ revenue, summary = {}, onSave }) {
  const rows = Array.isArray(revenue) ? revenue : [];
  const hasTarget = summary && summary.percentOfTarget != null && !Number.isNaN(Number(summary.percentOfTarget));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} className="text-rare-gold" />
        <h2 className="font-rare-serif text-xl text-rare-ink dark:text-rare-cream">Revenue</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatTile
          icon={TrendingUp}
          label="Monthly Revenue"
          value={currency.format(Number(summary?.monthlyRevenue) || 0)}
        />
        <StatTile
          icon={Briefcase}
          label="Monthly Jobs"
          value={summary?.monthlyJobCount ?? 0}
        />
        <StatTile
          icon={Percent}
          label="Win Rate"
          value={summary?.winRate != null ? `${summary.winRate}%` : 'No data'}
        />
        {hasTarget ? (
          <StatTile icon={Target} label="% of Target" value={`${summary.percentOfTarget}%`} />
        ) : (
          <div className="flex-1 min-w-[140px] rounded-lg border border-rare-gray/20 dark:border-rare-cream/10 bg-white dark:bg-rare-ink/40 p-4 shadow-card">
            <div className="flex items-center gap-2 text-rare-gray dark:text-rare-cream/60 text-xs font-rare-sans uppercase tracking-wide">
              <Target size={14} />
              <span>% of Target</span>
            </div>
            <div className="mt-1 text-sm font-rare-sans text-rare-gray dark:text-rare-cream/50">
              No revenue target configured.
            </div>
          </div>
        )}
      </div>

      <RevenueChart revenue={rows} />
      <RevenueTable revenue={rows} />
      <AddMonthForm onSave={onSave} />
    </div>
  );
}

RevenuePanel.propTypes = {
  revenue: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      invoiced: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      collected: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      job_count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ).isRequired,
  summary: PropTypes.shape({
    monthlyRevenue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    monthlyJobCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    percentOfTarget: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    winRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onSave: PropTypes.func.isRequired,
};
