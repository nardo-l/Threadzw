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
      primary: 'bg-neon text-neon-text font-bold hover:opacity-90 active:scale-95 shadow-[0_4px_15px_rgba(198, 255, 0,0.12)] text-[14px] tracking-[0.5px] uppercase border-none',
      secondary: 'bg-transparent border-[1.5px] border-white/25 text-white font-bold hover:bg-white/5 active:scale-95 text-[14px] tracking-[0.5px] uppercase',
      ghost: 'bg-transparent text-secondary-text font-bold hover:text-white text-xs uppercase',
    };

    const sizes = {
      sm: 'h-8 px-3 text-[11px] rounded-[8px]',
      md: 'min-h-[44px] h-[44px] px-5 text-[14px] rounded-[10px]',
      lg: 'min-h-[46px] h-[46px] px-6 text-[14px] rounded-[10px]',
      xl: 'min-h-[50px] h-[50px] px-8 text-[15px] rounded-[10px]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:pointer-events-none uppercase font-bold tracking-wider rounded-[10px] font-sans',
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
