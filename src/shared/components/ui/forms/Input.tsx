// src/shared/components/ui/forms/Input.tsx
import React, { forwardRef } from 'react';
import { cn } from '../../../utils/cn';
import { Eye, EyeOff, Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'search';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    variant = 'default',
    id,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const actualType = isPassword && showPassword ? 'text' : type;

    const baseStyles = 'flex w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    const errorStyles = error ? 'border-red-500 focus-visible:ring-red-500' : '';
    
    const iconStyles = {
      left: icon ? 'pl-10' : '',
      right: icon ? 'pr-10' : '',
    };

    const searchStyles = variant === 'search' ? 'pl-10 rounded-lg' : '';

    const renderIcon = () => {
      if (variant === 'search') {
        return (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className="h-4 w-4 text-secondary-500" />
          </div>
        );
      }
      
      if (icon && iconPosition === 'left') {
        return (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        );
      }
      
      if (icon && iconPosition === 'right') {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        );
      }
      
      return null;
    };

    const renderPasswordToggle = () => {
      if (!isPassword) return null;
      
      return (
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-500 hover:text-secondary-700"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      );
    };

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none text-secondary-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            id={inputId}
            type={actualType}
            className={cn(
              baseStyles,
              errorStyles,
              searchStyles,
              iconStyles[iconPosition],
              isPassword && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {renderIcon()}
          {renderPasswordToggle()}
        </div>
        
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-secondary-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };