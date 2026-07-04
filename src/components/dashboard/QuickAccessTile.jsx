import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const QuickAccessTile = ({ to, icon: Icon, title, description }) => {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/95 dark:bg-rare-ink shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all border border-transparent hover:border-rare-crimson/40"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rare-crimson/8 dark:bg-white/10 text-rare-crimson dark:text-rare-lime flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-rare-ink dark:text-white">
          {title}
        </p>
        <p className="text-xs text-rare-gray dark:text-white/50">
          {description}
        </p>
      </div>
    </Link>
  );
};

QuickAccessTile.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default QuickAccessTile;
