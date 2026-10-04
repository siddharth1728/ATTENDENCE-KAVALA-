import React from 'react'
import type { AttendanceStatus } from '../types'

interface StatusIndicatorProps {
  status: AttendanceStatus
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const isSafe = status === 'SAFE'
  const statusClass = isSafe ? 'status-safe' : 'status-danger'
  const defaultText = isSafe ? 'SAFE' : 'BELOW 75%'
  const displayText = label || defaultText

  return (
    <span
      className={`status-indicator ${statusClass} size-${size} ${className}`}
      role="status"
      aria-label={`Status: ${displayText}`}
    >
      <span className="status-dot" aria-hidden="true" />
      <span className="status-text">{displayText}</span>
    </span>
  )
}
