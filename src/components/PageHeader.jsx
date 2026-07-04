import React from 'react';
import PropTypes from 'prop-types';

/**
 * PageHeader — reusable branded page header ("Command Deck" treatment).
 *
 * A dark scrim band that keeps the title/subtitle legible over the app
 * wallpaper in both light and dark mode. Extracted from DashboardFixed.jsx.
 */
const PageHeader = ({ title, subtitle, icon: Icon, actions, children }) => {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-rare-dark/80 via-rare-dark/50 to-transparent px-4 py-4 md:px-6">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon className="w-6 h-6 md:w-7 md:h-7 text-rare-cream drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] flex-shrink-0" />
          )}
          <h1 className="font-rare-serif text-3xl md:text-4xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]">
            {title}
          </h1>
          {children}
        </div>
        {subtitle && (
          <p className="font-rare-sans text-xs uppercase tracking-[0.2em] text-rare-cream/80 mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="relative z-10 flex items-center gap-2 self-start">
          {actions}
        </div>
      )}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  icon: PropTypes.elementType,
  actions: PropTypes.node,
  children: PropTypes.node,
};

export default PageHeader;
