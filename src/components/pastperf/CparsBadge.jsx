import PropTypes from 'prop-types';

// CPARS rating → color mapping (Rare Earth palette)
// Exceptional / Very Good = lime, Satisfactory = gold, Marginal / Unsatisfactory = crimson, None = gray
const CPARS_STYLES = {
  Exceptional: 'bg-rare-lime/15 text-rare-lime-dark dark:bg-rare-lime/20 dark:text-rare-lime',
  'Very Good': 'bg-rare-lime/15 text-rare-lime-dark dark:bg-rare-lime/20 dark:text-rare-lime',
  Satisfactory: 'bg-rare-gold/20 text-rare-gold dark:bg-rare-gold/20 dark:text-rare-gold',
  Marginal: 'bg-rare-crimson/10 text-rare-crimson dark:bg-rare-crimson/20 dark:text-rare-crimson',
  Unsatisfactory: 'bg-rare-crimson/10 text-rare-crimson dark:bg-rare-crimson/20 dark:text-rare-crimson',
  None: 'bg-rare-gray/10 text-rare-gray dark:bg-white/10 dark:text-rare-cream/60',
};

export default function CparsBadge({ rating }) {
  const label = rating || 'None';
  const cls = CPARS_STYLES[label] || CPARS_STYLES.None;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-rare-sans whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}

CparsBadge.propTypes = {
  rating: PropTypes.string,
};
