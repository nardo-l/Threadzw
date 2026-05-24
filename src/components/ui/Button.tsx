import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, ...props }, ref) => {
    const variants = {
      primary: 'bg-neon text-neon-text font-extrabold hover:opacity-90 active:scale-95 shadow-[0_4px_20px_rgba(198,255,0,0.2)]',
      secondary: 'bg-transparent border-[1.5px] border-border text-white font-medium hover:bg-white/5 active:scale-95',
      ghost: 'bg-transparent text-secondary-text font-medium hover:text-white',
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm rounded-full',
      md: 'h-[48px] px-6 text-[15px] rounded-full',
      lg: 'h-[52px] px-8 text-[16px] rounded-full',
      xl: 'h-[56px] px-10 text-[17px] rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
