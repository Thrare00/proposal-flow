import React from 'react';

export function Separator({ className = '', orientation = 'horizontal', ...props }) {
  const isVertical = orientation === 'vertical';
  const base = isVertical ? 'w-px h-full' : 'h-px w-full';
  return <div className={`${base} bg-gray-200 ${className}`} role="separator" aria-orientation={orientation} {...props} />;
}

export default Separator;
