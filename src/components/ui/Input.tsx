import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'flex h-[54px] w-full bg-card-bg border-[1.5px] border-border rounded-xl px-4 text-base text-white placeholder:text-secondary-text transition-all focus:outline-none focus:border-neon focus:ring-4 focus:ring-neon/10 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus:border-error focus:ring-error/10',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs font-medium text-error px-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
