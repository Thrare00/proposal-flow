import React from 'react';

export function Select({ value, onValueChange, children, className = '' }) {
  return (
    <select
      className={`border rounded px-2 py-1 w-full ${className}`}
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
