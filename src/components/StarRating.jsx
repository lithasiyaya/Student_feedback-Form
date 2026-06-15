import { useState } from 'react'
import './StarRating.css'

const LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

export default function StarRating({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0)

  const activeValue = hovered || value

  return (
    <div
      className="star-rating"
      role="radiogroup"
      aria-label="Rating from 1 to 5"
      onMouseLeave={() => !disabled && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star – ${LABELS[star - 1]}`}
          className={`star-btn ${activeValue >= star ? 'star-btn--active' : ''}`}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHovered(star)}
          onFocus={() => !disabled && setHovered(star)}
          onBlur={() => !disabled && setHovered(0)}
          disabled={disabled}
          tabIndex={0}
        >
          ★
        </button>
      ))}
      {activeValue > 0 && (
        <span className="star-label" aria-live="polite">
          {LABELS[activeValue - 1]}
        </span>
      )}
    </div>
  )
}
