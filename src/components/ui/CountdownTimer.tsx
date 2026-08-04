'use client'

import { useEffect, useState } from 'react'

const SALE_DURATION_MS = 24 * 60 * 60 * 1000

function format(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  }
}

export default function CountdownTimer() {
  const [remaining, setRemaining] = useState(() =>
    format(Math.max(0, SALE_DURATION_MS)),
  )

  useEffect(() => {
    const deadline = Date.now() + SALE_DURATION_MS
    const timer = setInterval(() => {
      setRemaining(format(Math.max(0, deadline - Date.now())))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const { hours, minutes, seconds } = remaining

  return (
    <div className="countdown-timer" aria-label="Time remaining in flash sale">
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
