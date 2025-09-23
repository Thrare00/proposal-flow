import React, { useState, useRef, useEffect } from 'react';

export function DropdownMenu({ children }) {
  return <div className="relative inline-block text-left">{children}</div>;
}

export function DropdownMenuTrigger({ children, className = '', ...props }) {
  return (
    <button type="button" className={`inline-flex items-center ${className}`} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className = '', align = 'end', ...props }) {
  const alignCls = align === 'start' ? 'left-0' : 'right-0';
  return (
    <div className={`absolute z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${alignCls} ${className}`} role="menu" {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onSelect, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
      onClick={onSelect}
      role="menuitem"
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className = '', ...props }) {
  return <div className={`my-1 h-px bg-gray-200 ${className}`} role="separator" {...props} />;
}

export default DropdownMenu;
