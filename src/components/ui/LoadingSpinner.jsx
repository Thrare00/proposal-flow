export function LoadingSpinner({ children, className = '' }) {
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

export default LoadingSpinner;
