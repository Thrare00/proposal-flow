import PropTypes from 'prop-types';

function formatAlertDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * AmendmentBadge — shown only when a tracked proposal's SAM.gov solicitation
 * has changed since Proposal Flow last recorded it (see server/amendment-watcher.js).
 * Renders nothing when there's no live alert on the proposal (real-data-only).
 */
function AmendmentBadge({ proposal, showDetail = false, className = '' }) {
  const alert = proposal?.metadata?.amendmentAlert;
  if (!alert) return null;

  const dateLabel = formatAlertDate(alert.postedDate) || formatAlertDate(alert.detectedAt);
  const detailText = alert.detail || 'Solicitation updated on SAM.gov — re-check requirements.';
  const tooltip = dateLabel ? `${detailText} (posted ${dateLabel})` : detailText;

  return (
    <span className={`inline-flex ${showDetail ? 'flex-col items-start gap-1' : 'items-center'} ${className}`}>
      <span
        title={tooltip}
        className="animate-pulse inline-flex items-center gap-1 rounded-full border border-rare-crimson bg-rare-crimson/15 px-2.5 py-1 font-rare-sans text-[11px] font-bold uppercase tracking-wider text-rare-crimson"
      >
        <span aria-hidden="true">⚠</span>
        Amendment
      </span>
      {showDetail && (
        <span className="font-rare-sans text-[11px] leading-snug text-rare-crimson/80">
          {detailText}
          {dateLabel ? ` — posted ${dateLabel}` : ''}
        </span>
      )}
    </span>
  );
}

AmendmentBadge.propTypes = {
  proposal: PropTypes.shape({
    metadata: PropTypes.shape({
      amendmentAlert: PropTypes.shape({
        detectedAt: PropTypes.string,
        detail: PropTypes.string,
        noticeId: PropTypes.string,
        postedDate: PropTypes.string,
        url: PropTypes.string,
      }),
    }),
  }),
  // When true, also renders a text line with the detail + date beneath the
  // badge (used on the dashboard hero and proposal detail page). Card grids
  // pass false to keep the badge compact.
  showDetail: PropTypes.bool,
  className: PropTypes.string,
};

export default AmendmentBadge;
