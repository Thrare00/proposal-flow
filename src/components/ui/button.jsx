import React from 'react';
import { Link } from 'react-router-dom';

const VARIANT_STYLES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
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
  const classes = `px-3 py-2 rounded disabled:opacity-50 ${VARIANT_STYLES[variant] || VARIANT_STYLES.primary} ${className}`.trim();

  // Handle Radix UI Slot pattern (asChild)
  if (asChild) {
    const { children: slotChild, className: slotClass, ...slotRest } = rest;
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
