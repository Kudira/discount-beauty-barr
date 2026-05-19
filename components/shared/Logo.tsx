import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ variant = 'dark', size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const colors = {
    dark: { wordmark: 'text-[#2C2420]', dot: '#B76E79' },
    light: { wordmark: 'text-white', dot: '#F2CFC3' },
  }

  const c = colors[variant]

  return (
    <Link href="/" className={cn('flex items-baseline group', className)}>
      <span
        className={cn(
          'font-display font-light leading-none transition-opacity group-hover:opacity-80',
          sizes[size],
          c.wordmark
        )}
        style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.02em' }}
      >
        Discount Beauty Barr
        <span style={{ color: c.dot }}>.</span>
      </span>
    </Link>
  )
}
