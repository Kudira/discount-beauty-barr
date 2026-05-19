import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center' | 'right'
  titleClassName?: string
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  titleClassName,
  className,
}: SectionHeadingProps) {
  const alignClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align]

  return (
    <div className={cn('flex flex-col gap-3', alignClass, className)}>
      {eyebrow && (
        <span className="font-body font-light text-xs uppercase tracking-[0.3em] text-[#B76E79]">
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'font-display text-[#2C2420]',
          titleClassName
        )}
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="font-body font-light text-[#8C7B74] max-w-xl leading-relaxed">
          {subtitle}
        </p>
      )}
      <div
        className={cn(
          'h-px w-16 mt-1',
          align === 'center' && 'mx-auto',
          align === 'right' && 'ml-auto'
        )}
        style={{
          background: 'linear-gradient(to right, #E8B4A0, #B76E79)',
        }}
      />
    </div>
  )
}
