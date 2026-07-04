import React from 'react';

export function Select({ value, onValueChange, children, className = '' }) {
  return (
    <select
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 ${className}`}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className = '' }) { 
  return <div className={className}>{children}</div>; 
}

export function SelectContent({ children, className = '' }) { 
  return <div className={className}>{children}</div>; 
}

export function SelectItem({ value, children, className = '' }) {
  return (
    <option value={value} className={className}>
      {children}
    </option>
  );
}

export function SelectValue({ placeholder, className = '' }) {
  return (
    <option value="" className={className}>
      {placeholder}
    </option>
  );
}

export default Select;
