import PropTypes from 'prop-types';

const OutcomeBadge = ({ outcome = '' }) => {
  // Normalize outcome case
  const normalizedOutcome = (outcome || '').toLowerCase().trim();

  // Map outcomes to display text and styles
  let displayText = '—';
  let styles = 'bg-gray-100 text-rare-gray dark:bg-white/10 dark:text-white/60';

  switch (normalizedOutcome) {
    case 'win':
    case 'won':
      displayText = 'WON';
      styles = 'bg-rare-lime/15 text-rare-lime-dark';
      break;
    case 'loss':
    case 'lost':
      displayText = 'LOST';
      styles = 'bg-rare-crimson/10 text-rare-crimson';
      break;
    case 'pending':
      displayText = 'PENDING';
      styles = 'bg-rare-gold/15 text-rare-gold';
      break;
    case 'pass':
      displayText = 'PASS';
      styles = 'bg-gray-100 text-rare-gray dark:bg-white/10 dark:text-white/60';
      break;
    default:
      displayText = '—';
      styles = 'bg-gray-100 text-rare-gray dark:bg-white/10 dark:text-white/60';
  }

  const baseStyles = 'font-rare-sans uppercase text-[10px] tracking-wide rounded-full px-2 py-0.5 inline-block';

  return <span className={`${baseStyles} ${styles}`}>{displayText}</span>;
};

OutcomeBadge.propTypes = {
  outcome: PropTypes.string,
};

export default OutcomeBadge;
