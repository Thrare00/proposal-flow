import { Link } from 'react-router-dom';

/**
 * Accessible button component that supports both button and link functionality
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Button content
 * @param {string} [props.to] - URL for link buttons
 * @param {'default'|'outline'|'ghost'} [props.variant='default'] - Visual style variant
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.type='button'] - Button type attribute
 * @param {string} [props.ariaLabel] - Accessible label for screen readers
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.id] - Unique identifier
 */
export function Button({
  children,
  to,
  variant = 'default',
  className = '',
  onClick,
  type = 'button',
  ariaLabel,
  disabled = false,
  id,
  ...props
}) {
  const baseStyles = 'inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors';
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:text-gray-900'
  };

  const buttonStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.replace(/\s+/g, ' ').trim(); // Remove extra whitespace

  if (to) {
    return (
      <Link 
        to={to}
        className={buttonStyles}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        id={id}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={buttonStyles}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      id={id}
      {...props}
    >
      {children}
    </button>
  );
}
