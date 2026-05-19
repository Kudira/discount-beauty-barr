import type { ProductCategory } from '@/types'
import { cn } from '@/lib/utils'

const categoryConfig: Record<ProductCategory, { label: string; color: string; bg: string }> = {
  skincare:  { label: 'Skincare',   color: '#7D4E57', bg: '#F2EDE8' },
  makeup:    { label: 'Makeup',     color: '#B76E79', bg: '#FAF0F1' },
  haircare:  { label: 'Haircare',   color: '#8C7B74', bg: '#F5F0EE' },
  fragrance: { label: 'Fragrance',  color: '#9A5560', bg: '#FDF0F2' },
  tools:     { label: 'Tools',      color: '#6B7280', bg: '#F3F4F6' },
  body:      { label: 'Body Care',  color: '#7D6B5E', bg: '#F5F0EC' },
}

interface CategoryBadgeProps {
  category: ProductCategory
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category]
  return (
    <span
      className={cn('inline-block px-2.5 py-0.5', className)}
      style={{
        background: config.bg,
        color: config.color,
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: '12px',
        letterSpacing: '0.06em',
        borderRadius: '2px',
      }}
    >
      {config.label}
    </span>
  )
}

export { categoryConfig }
