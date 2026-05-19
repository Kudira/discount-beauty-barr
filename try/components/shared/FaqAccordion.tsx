'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col divide-y divide-[#E8DDD4]">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 400,
                  fontSize: '18px',
                  color: isOpen ? '#B76E79' : '#2C2420',
                  transition: 'color 0.2s',
                }}
              >
                {item.question}
              </span>
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: isOpen ? '#B76E79' : '#F2EDE8',
                  transition: 'background 0.2s',
                }}
              >
                {isOpen
                  ? <Minus className="w-3.5 h-3.5 text-white" />
                  : <Plus className="w-3.5 h-3.5" style={{ color: '#B76E79' }} />
                }
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? '400px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.35s ease',
              }}
            >
              <p
                className="pb-5 pr-10"
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 300,
                  fontSize: '15px',
                  lineHeight: 1.8,
                  color: '#8C7B74',
                }}
              >
                {item.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
