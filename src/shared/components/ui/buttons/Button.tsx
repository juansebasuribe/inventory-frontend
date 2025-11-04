// src/shared/components/ui/buttons/Button.tsx
import React, { forwardRef } from 'react';
import { cn } from '../../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
      secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300 border border-secondary-300',
      outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
      ghost: 'text-secondary-700 hover:bg-secondary-100 active:bg-secondary-200',
      link: 'text-primary-600 underline-offset-4 hover:underline',
      destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
      md: 'h-10 px-4 py-2 text-sm rounded-md gap-2',
      lg: 'h-11 px-6 py-2 text-base rounded-lg gap-2',
      xl: 'h-12 px-8 py-3 text-base rounded-lg gap-3',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        
        {children && (
          <span className={cn(
            'whitespace-nowrap',
            loading && 'ml-2'
          )}>
            {children}
          </span>
        )}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };