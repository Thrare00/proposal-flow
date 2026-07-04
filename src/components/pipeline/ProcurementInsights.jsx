import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Filter, Percent, Clock } from 'lucide-react';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-rare-gold" aria-hidden="true" />
      <h3 className="font-rare-sans uppercase tracking-wide text-xs font-semibold text-rare-gray dark:text-gray-400">
        {title}
      </h3>
    </div>
  );
}

SectionHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
};

function CardShell({ children }) {
  return (
    <div className="bg-white/95 dark:bg-rare-ink shadow-card rounded-xl p-5 border border-black/5 dark:border-white/10">
      {children}
    </div>
  );
}

CardShell.propTypes = {
  children: PropTypes.node.isRequired,
};

function ProcurementInsights({ bids = [], serviceLabels = {} }) {
  const funnel = useMemo(() => {
    const total = bids.length;
    const won = bids.filter((b) => b.outcome === 'won').length;
    const lost = bids.filter((b) => b.outcome === 'lost').length;
    const pending = Math.max(total - won - lost, 0);

    return {
      total,
      stages: [
        { key: 'total', label: 'Total', count: total, colorClass: 'bg-rare-ink dark:bg-white/30' },
        { key: 'pending', label: 'Pending', count: pending, colorClass: 'bg-rare-gray' },
        { key: 'won', label: 'Won', count: won, colorClass: 'bg-rare-gold momentum-fill' },
        { key: 'lost', label: 'Lost', count: lost, colorClass: 'bg-rare-lime' },
      ],
    };
  }, [bids]);

  const winRateByService = useMemo(() => {
    const grouped = {};

    bids.forEach((bid) => {
      const key = bid.service || 'unspecified';
      if (!grouped[key]) {
        grouped[key] = { won: 0, lost: 0 };
      }
      if (bid.outcome === 'won') grouped[key].won += 1;
      else if (bid.outcome === 'lost') grouped[key].lost += 1;
    });

    return Object.entries(grouped)
      .map(([service, counts]) => {
        const decided = counts.won + counts.lost;
        if (decided === 0) return null;
        return {
          service,
          label: (serviceLabels && serviceLabels[service]) || service,
          won: counts.won,
          lost: counts.lost,
          decided,
          rate: counts.won / decided,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.decided - a.decided);
  }, [bids, serviceLabels]);

  const timeToWin = useMemo(() => {
    const durations = bids
      .filter((b) => b.outcome === 'won' && b.bid_date && b.decided_date)
      .map((b) => (new Date(b.decided_date).getTime() - new Date(b.bid_date).getTime()) / MS_PER_DAY)
      .filter((d) => Number.isFinite(d) && d >= 0);

    if (durations.length === 0) return null;

    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    return { avgDays: avg, sampleSize: durations.length };
  }, [bids]);

  const maxFunnelCount = Math.max(funnel.total, 1);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-3">
        <CardShell>
          <SectionHeader icon={Filter} title="Bid Funnel" />
          {funnel.total === 0 ? (
            <p className="text-sm text-rare-gray dark:text-gray-400">No bids yet.</p>
          ) : (
            <div className="space-y-3">
              {funnel.stages.map((stage) => {
                const widthPct = Math.max((stage.count / maxFunnelCount) * 100, stage.count > 0 ? 4 : 0);
                return (
                  <div key={stage.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-rare-sans uppercase text-xs tracking-wide text-rare-gray dark:text-gray-400">
                        {stage.label}
                      </span>
                      <span className="font-rare-serif text-sm font-semibold text-rare-ink dark:text-white">
                        {stage.count}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${stage.colorClass}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardShell>
      </div>

      <div className="md:col-span-2">
        <CardShell>
          <SectionHeader icon={Percent} title="Win Rate by Service" />
          {winRateByService.length === 0 ? (
            <p className="text-sm text-rare-gray dark:text-gray-400">
              No decided bids yet to calculate win rate.
            </p>
          ) : (
            <div className="space-y-3">
              {winRateByService.map((row) => (
                <div key={row.service}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-rare-ink dark:text-white truncate pr-2">{row.label}</span>
                    <span className="font-rare-serif text-sm font-semibold text-rare-ink dark:text-white shrink-0">
                      {Math.round(row.rate * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rare-gold"
                      style={{ width: `${Math.max(row.rate * 100, row.won > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-rare-gray dark:text-gray-400">
                    {row.won} won / {row.decided} decided
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardShell>
      </div>

      <div className="md:col-span-1">
        <CardShell>
          <SectionHeader icon={Clock} title="Time to Win" />
          {timeToWin === null ? (
            <p className="text-sm text-rare-gray dark:text-gray-400">
              Not enough decided bids to measure yet.
            </p>
          ) : (
            <div>
              <p className="font-rare-serif text-3xl font-semibold text-rare-ink dark:text-white">
                {timeToWin.avgDays.toFixed(1)}
                <span className="text-base font-rare-sans font-normal text-rare-gray dark:text-gray-400 ml-1">
                  days
                </span>
              </p>
              <p className="mt-1 text-xs text-rare-gray dark:text-gray-400">
                avg across {timeToWin.sampleSize} won bid{timeToWin.sampleSize === 1 ? '' : 's'}
              </p>
            </div>
          )}
        </CardShell>
      </div>
    </div>
  );
}

ProcurementInsights.propTypes = {
  bids: PropTypes.arrayOf(
    PropTypes.shape({
      outcome: PropTypes.string,
      service: PropTypes.string,
      bid_amount: PropTypes.number,
      bid_date: PropTypes.string,
      decided_date: PropTypes.string,
    })
  ),
  serviceLabels: PropTypes.objectOf(PropTypes.string),
};

export default ProcurementInsights;
