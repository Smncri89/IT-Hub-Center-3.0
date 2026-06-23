import React from 'react';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, containerClassName = '', className = '', children, ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1 ${containerClassName}`}>
        {label && (
          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full appearance-none
              bg-white dark:bg-neutral-800
              border border-neutral-200 dark:border-neutral-700
              text-neutral-900 dark:text-neutral-100
              text-sm font-medium
              rounded-xl
              px-3 py-2 pr-9
              focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400
              hover:border-neutral-300 dark:hover:border-neutral-600
              transition-colors duration-150
              cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-400 focus:ring-red-400/40' : ''}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-neutral-400 dark:text-neutral-500">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

export default SelectField;
