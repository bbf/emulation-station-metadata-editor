// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useRef, useState, useCallback } from 'react'
import '../styles/components/StarRating.css'

interface Props {
  value: number
  onChange: (value: number) => void
}

export default function StarRating({ value, onChange }: Props): React.JSX.Element {
  const starsRef = useRef<HTMLDivElement>(null)
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)

  const calcValue = useCallback(
    (clientX: number): number => {
      const el = starsRef.current
      if (!el) return value
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      return Math.round((x / rect.width) * 10) / 10
    },
    [value]
  )

  const handleMouseDown = (e: React.MouseEvent): void => {
    setDragging(true)
    const v = calcValue(e.clientX)
    setHoverValue(v)
    onChange(v)
  }

  const handleMouseMove = (e: React.MouseEvent): void => {
    const v = calcValue(e.clientX)
    setHoverValue(v)
    if (dragging) onChange(v)
  }

  const handleMouseUp = (): void => {
    setDragging(false)
  }

  const handleMouseLeave = (): void => {
    setHoverValue(null)
    setDragging(false)
  }

  const display = hoverValue !== null ? hoverValue : value
  const filledStars = Math.round(display * 5)

  return (
    <div className="star-rating">
      <div
        className="star-rating-stars"
        ref={starsRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`star ${i < filledStars ? 'filled' : 'empty'}`}>
            ★
          </span>
        ))}
      </div>
      <span className="star-value">{display.toFixed(1)}</span>
    </div>
  )
}
