import { HTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-card-bg border-border',
      elevated: 'bg-ele-bg border-border',
      outline: 'bg-transparent border-border',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'border rounded-2xl overflow-hidden',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
