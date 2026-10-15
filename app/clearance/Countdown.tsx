'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Counts down to `target`. When it reaches zero the page asks the server to
// re-check the sale window, so the shop opens or closes without a manual refresh.
export default function Countdown({ target, serverNow }: { target: string; serverNow: number }) {
  const router = useRouter()
  const end = new Date(target).getTime()
  const [ms, setMs] = useState(Math.max(0, end - serverNow))

  useEffect(() => {
    let done = false
    const tick = () => {
      const left = Math.max(0, end - Date.now())
      setMs(left)
      if (left === 0 && !done) {
        done = true
        router.refresh()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [end, router])

  const s = Math.floor(ms / 1000)
  const parts: [number, string][] = [
    [Math.floor(s / 86400), 'days'],
    [Math.floor((s % 86400) / 3600), 'hours'],
    [Math.floor((s % 3600) / 60), 'mins'],
    [s % 60, 'secs'],
  ]

  return (
    <div className="clr-count" role="timer" aria-label="Time remaining">
      {parts.map(([v, l]) => (
        <div className="clr-cell" key={l}>
          <b>{String(v).padStart(2, '0')}</b>
          <small>{l}</small>
        </div>
      ))}
    </div>
  )
}
