import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import OutcomeBadge from './OutcomeBadge';

const BidHistoryTable = ({ bids = [], serviceLabels = {} }) => {
  const [filter, setFilter] = useState('all');

  const filteredBids = useMemo(() => {
    if (filter === 'all') return bids;
    return bids.filter((bid) => bid.outcome === filter);
  }, [bids, filter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMarginColor = (margin) => {
    return margin >= 0 ? 'text-rare-lime' : 'text-rare-crimson';
  };

  const filterOptions = ['all', 'win', 'loss', 'pending', 'pass'];

  return (
    <div className="bg-white/95 dark:bg-rare-ink rounded-xl shadow-card p-6">
      {/* Filter Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-4 py-2 rounded-lg font-rare-sans text-sm transition-all ${
                filter === option
                  ? 'bg-rare-gold text-rare-ink'
                  : 'bg-gray-100 dark:bg-white/10 text-rare-gray dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/20'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredBids.length === 0 ? (
        <div className="text-center py-8 text-rare-gray dark:text-white/50 font-rare-sans">
          No bids recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-light dark:border-white/10">
                <th className="px-4 py-3 text-left font-rare-serif font-semibold text-rare-gray dark:text-white/80">
                  Client
                </th>
                <th className="px-4 py-3 text-left font-rare-serif font-semibold text-rare-gray dark:text-white/80">
                  Service
                </th>
                <th className="px-4 py-3 text-left font-rare-serif font-semibold text-rare-gray dark:text-white/80">
                  Qty
                </th>
                <th className="px-4 py-3 text-right font-rare-serif font-semibold text-rare-gray dark:text-white/80">
                  Bid
                </th>
                <th className="px-4 py-3 text-right font-rare-serif font-semibold text-rare-gray dark:text-white/80">
                  Cost
                </th>
                <th className="px-4 py-3 text-right font-rare-serif font-semibold text-rare-gray dark:text-white/80">
                  Margin
                </th>
                <th className="px-4 py-3 text-center font-rare-serif font-semibold text-rare-gray dark:text-white/80">
                  Outcome
                </th>
                <th className="px-4 py-3 text-left font-rare-serif font-semibold text-rare-gray dark:text-white/80">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBids.map((bid, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-light dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-rare-sans text-rare-ink dark:text-white">
                    {bid.client_name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-rare-sans text-rare-ink dark:text-white">
                      {serviceLabels[bid.service] || bid.service}
                    </div>
                    {bid.sub_scope && (
                      <div className="text-xs text-rare-gray dark:text-white/50">
                        {bid.sub_scope}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-rare-sans text-rare-ink dark:text-white">
                    {bid.quantity} {bid.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-rare-sans text-rare-ink dark:text-white">
                    {formatCurrency(bid.bid_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-rare-sans text-rare-ink dark:text-white">
                    {formatCurrency(bid.cost_amount)}
                  </td>
                  <td className={`px-4 py-3 text-right font-rare-sans font-semibold ${getMarginColor(bid.margin_pct)}`}>
                    {bid.margin_pct}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <OutcomeBadge outcome={bid.outcome} />
                  </td>
                  <td className="px-4 py-3 font-rare-sans text-rare-gray dark:text-white/70">
                    {formatDate(bid.bid_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

BidHistoryTable.propTypes = {
  bids: PropTypes.arrayOf(
    PropTypes.shape({
      client_name: PropTypes.string.isRequired,
      service: PropTypes.string.isRequired,
      sub_scope: PropTypes.string,
      quantity: PropTypes.number.isRequired,
      unit: PropTypes.string.isRequired,
      bid_amount: PropTypes.number.isRequired,
      cost_amount: PropTypes.number.isRequired,
      margin_pct: PropTypes.number.isRequired,
      outcome: PropTypes.oneOf(['win', 'loss', 'pending', 'pass']).isRequired,
      bid_date: PropTypes.string.isRequired,
    })
  ),
  serviceLabels: PropTypes.object,
};

export default BidHistoryTable;
