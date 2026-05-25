import * as React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    // Tailwind base + variants
    let baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50'
    
    let variantStyles = ''
    switch(variant) {
      case 'default':
        variantStyles = 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
        break
      case 'secondary':
        variantStyles = 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container'
        break
      case 'outline':
        variantStyles = 'border border-outline bg-surface text-on-surface hover:bg-surface-variant hover:text-on-surface-variant'
        break
      case 'ghost':
        variantStyles = 'hover:bg-surface-variant text-on-surface'
        break
    }

    let sizeStyles = ''
    switch(size) {
      case 'default':
        sizeStyles = 'h-10 px-4 py-2'
        break
      case 'sm':
        sizeStyles = 'h-9 rounded-md px-3'
        break
      case 'lg':
        sizeStyles = 'h-11 rounded-md px-8'
        break
      case 'icon':
        sizeStyles = 'h-10 w-10'
        break
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
