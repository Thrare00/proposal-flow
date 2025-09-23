import React from 'react';

export function Avatar({ className = '', children, ...props }) {
  return (
    <div className={`inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AvatarFallback({ className = '', children, ...props }) {
  return (
    <span className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Avatar;
