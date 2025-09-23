import React from 'react';

export function Badge({ children, className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-200 text-gray-700',
    outline: 'border border-gray-300 text-gray-700',
  };
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const cls = `${base} ${variants[variant] || variants.default} ${className}`;
  return (
    <span className={cls} {...props}>
      {children}
    </span>
  );
}

export default Badge;
