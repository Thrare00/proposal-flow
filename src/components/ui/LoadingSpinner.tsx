import { ReactNode } from 'react';

interface LoadingSpinnerProps {
  children?: ReactNode;
  className?: string;
}

export function LoadingSpinner({ children, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      {children && (
        <div className="ml-4">
          {children}
        </div>
      )}
    </div>
  );
}
