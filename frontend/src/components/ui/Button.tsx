import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'active' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'icon'
  isActive?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      isActive = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles: sharp, matte dark, high-contrast text, clear focus ring
    const base =
      'inline-flex items-center justify-center font-medium transition-colors ' +
      'rounded-[4px] border select-none cursor-pointer disabled:opacity-40 ' +
      'disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 ' +
      'focus-visible:ring-[#60A5FA]'

    // Size variants
    const sizes = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-8 px-3 text-sm gap-2',
      icon: 'h-8 w-8 p-0 text-sm flex-shrink-0',
    }

    // Color variants according to dark theme tokens
    const variants = {
      default:
        'bg-[#1A1A20] hover:bg-[#24242C] text-[#F4F4F6] border-[#2A2A34] active:bg-[#2E2E3A]',
      primary:
        'bg-[#2A2A38] hover:bg-[#343444] text-[#F4F4F6] border-[#3E3E50] active:bg-[#3E3E52]',
      active:
        'bg-[#262634] text-[#60A5FA] border-[#60A5FA] shadow-[0_0_0_1px_#60A5FA]',
      ghost:
        'bg-transparent hover:bg-[#202028] text-[#9090A0] hover:text-[#F4F4F6] border-transparent',
      icon:
        'bg-[#1A1A20] hover:bg-[#24242C] text-[#9090A0] hover:text-[#F4F4F6] border-[#2A2A34]',
    }

    const appliedVariant = isActive ? variants.active : variants[variant]

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${base} ${sizes[size]} ${appliedVariant} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
