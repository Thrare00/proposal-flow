import PropTypes from 'prop-types';

function formatAlertDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * AmendmentBadge — shown only when a tracked proposal has a live amendment
 * alert. Two sources feed `metadata.amendmentAlert`:
 *  - SAM.gov solicitation changes (see server/amendment-watcher.js)
 *  - Amendment/addendum emails from BidNet/SAM/IonWave/agency senders
 *    (see server/amendment-email-watcher.js)
 * When the alert is a `type: 'due_date_change'` (an inbound amendment email
 * with a parsed revised due date), the old → new date is the thing the
 * owner must not miss, so it's rendered prominently in crimson instead of
 * the generic "re-check requirements" copy.
 * Renders nothing when there's no live alert on the proposal (real-data-only).
 */
function AmendmentBadge({ proposal, showDetail = false, className = '' }) {
  const alert = proposal?.metadata?.amendmentAlert;
  if (!alert) return null;

  const isDueDateChange = alert.type === 'due_date_change';
  const dateLabel = formatAlertDate(alert.postedDate) || formatAlertDate(alert.detectedAt);
  const fromLabel = formatAlertDate(alert.from) || alert.from || 'unknown';
  const toLabel = formatAlertDate(alert.to) || alert.to || 'unknown';

  const badgeLabel = isDueDateChange ? 'Due Date Changed' : 'Amendment';
  const detailText = isDueDateChange
    ? `Due date changed: ${fromLabel} → ${toLabel}`
    : (alert.detail || alert.subject || 'Solicitation updated — re-check requirements.');
  const tooltip = isDueDateChange
    ? `${detailText}${alert.subject ? ` ("${alert.subject}")` : ''}`
    : (dateLabel ? `${detailText} (posted ${dateLabel})` : detailText);

  return (
    <span className={`inline-flex ${showDetail ? 'flex-col items-start gap-1' : 'items-center'} ${className}`}>
      <span
        title={tooltip}
        className="animate-pulse inline-flex items-center gap-1 rounded-full border border-rare-crimson bg-rare-crimson/15 px-2.5 py-1 font-rare-sans text-[11px] font-bold uppercase tracking-wider text-rare-crimson"
      >
        <span aria-hidden="true">⚠</span>
        {badgeLabel}
      </span>
      {showDetail && (
        isDueDateChange ? (
          <span className="font-rare-sans text-[13px] font-bold leading-snug text-rare-crimson">
            {fromLabel} <span aria-hidden="true">→</span> {toLabel}
            {alert.subject && (
              <span className="ml-1 font-normal text-rare-crimson/70">({alert.subject})</span>
            )}
          </span>
        ) : (
          <span className="font-rare-sans text-[11px] leading-snug text-rare-crimson/80">
            {detailText}
            {dateLabel ? ` — posted ${dateLabel}` : ''}
          </span>
        )
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
        // Fields used by the due_date_change alert shape (amendment emails).
        type: PropTypes.string,
        from: PropTypes.string,
        to: PropTypes.string,
        subject: PropTypes.string,
        source: PropTypes.string,
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
