import React from 'react';
import { Link } from 'react-router-dom';

const VARIANT_STYLES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400 dark:text-slate-200 dark:hover:bg-slate-800',
};

export default function Button({
  children,
  className = '',
  to,
  as,
  asChild,
  variant = 'primary',
  type = 'button',
  ...rest
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${VARIANT_STYLES[variant] || VARIANT_STYLES.primary} ${className}`.trim();

  // Handle Radix UI Slot pattern (asChild)
  if (asChild) {
    const slotChild = rest.children;
    const slotRest = { ...rest };
    delete slotRest.children;
    delete slotRest.className;
    return (
      <span className={classes} {...slotRest}>
        {slotChild || children}
      </span>
    );
  }

  if (to) {
    return (
      <Link className={classes} to={to} {...rest}>
        {children}
      </Link>
    );
  }

  if (as === Link && rest.to) {
    return (
      <Link className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
