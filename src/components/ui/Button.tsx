import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  children: ReactNode;
  to?: string;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  to,
  variant = 'default',
  className = '',
  onClick,
  type
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors';
  const variantStyles: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:text-gray-900'
  };

  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={buttonStyles}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      className={buttonStyles}
    >
      {children}
    </button>
  );
}
