'use client'

import { useEffect, useState } from 'react'

const CYCLE_MS = 7 * 24 * 60 * 60 * 1000
const DEADLINE_KEY = 'technest-flash-deadline'

function getDeadline(): number {
  const now = Date.now()
  if (typeof window === 'undefined') return now + CYCLE_MS
  let deadline = 0
  try {
    deadline = Number(window.localStorage.getItem(DEADLINE_KEY) ?? 0)
  } catch {
    deadline = 0
  }
  if (!deadline || deadline - now <= 0 || deadline - now > CYCLE_MS) {
    deadline = now + CYCLE_MS
    try {
      window.localStorage.setItem(DEADLINE_KEY, String(deadline))
    } catch {
      /* ignore storage errors */
    }
  }
  return deadline
}

interface Parts {
  days: string
  hours: string
  minutes: string
  seconds: string
}

function format(ms: number): Parts {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  }
}

export default function CountdownTimer() {
  const [parts, setParts] = useState<Parts>(() =>
    format(getDeadline() - Date.now()),
  )

  useEffect(() => {
    const tick = () => {
      const remaining = getDeadline() - Date.now()
      setParts(format(remaining))
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  const { days, hours, minutes, seconds } = parts

  return (
    <div className="countdown-timer" aria-label="Time remaining in flash sale">
      <div className="cd-box">
        <strong>{days}</strong>
        <span>days</span>
      </div>
      <span className="cd-sep">:</span>
      <div className="cd-box">
        <strong>{hours}</strong>
        <span>hrs</span>
      </div>
      <span className="cd-sep">:</span>
      <div className="cd-box">
        <strong>{minutes}</strong>
        <span>min</span>
      </div>
      <span className="cd-sep">:</span>
      <div className="cd-box">
        <strong>{seconds}</strong>
        <span>sec</span>
      </div>
    </div>
  )
}
