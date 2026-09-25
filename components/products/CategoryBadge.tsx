import type { ProductCategory } from '@/types'
import { cn } from '@/lib/utils'

const categoryConfig: Record<ProductCategory, { label: string; color: string; bg: string }> = {
  skincare:  { label: 'Skincare',   color: '#7D4E57', bg: '#F2EDE8' },
  makeup:    { label: 'Makeup',     color: '#B76E79', bg: '#FAF0F1' },
  haircare:  { label: 'Hair Care',   color: '#8C7B74', bg: '#F5F0EE' },
  fragrance: { label: 'Fragrance',  color: '#9A5560', bg: '#FDF0F2' },
  tools:     { label: 'Tools',      color: '#6B7280', bg: '#F3F4F6' },
  body:      { label: 'Body Care',  color: '#7D6B5E', bg: '#F5F0EC' },
  wellness:  { label: 'Wellness',   color: '#5E7D6B', bg: '#EEF5F0' },
  'oral-care': { label: 'Oral Care', color: '#4E6B7D', bg: '#EEF3F5' },
  personal:  { label: 'Personal Care', color: '#6B5E7D', bg: '#F1EEF5' },
  intimate:  { label: 'Intimate Care', color: '#9A5560', bg: '#FAF0F1' },
  home:      { label: 'Home & Lifestyle', color: '#7D6B4E', bg: '#F5F1EA' },
}

interface CategoryBadgeProps {
  category: ProductCategory
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category] ?? { label: category, color: '#8C7B74', bg: '#F5F0EE' }
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
