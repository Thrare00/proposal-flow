import React from 'react';

export function Checkbox({ checked = false, onChange, className = '', label, id, ...props }) {
  const inputId = id || `chk_${Math.random().toString(36).slice(2)}`;
  return (
    <label htmlFor={inputId} className={`inline-flex items-center space-x-2 cursor-pointer ${className}`}>
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        {...props}
      />
      {label ? <span className="text-sm text-gray-700">{label}</span> : null}
    </label>
  );
}

export default Checkbox;
