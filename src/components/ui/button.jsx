export default function Button({ children, className = "", ...rest }) {
  return (
    <button
      className={`px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
