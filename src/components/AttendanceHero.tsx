import React from 'react'
import type { CategoryAttendance } from '../types'
import { StatusIndicator } from './StatusIndicator'
import { formatPercent } from '../engine'

interface AttendanceHeroProps {
  data: CategoryAttendance
  onOpenUpdateSheet: () => void
}

export const AttendanceHero: React.FC<AttendanceHeroProps> = ({
  data,
  onOpenUpdateSheet,
}) => {
  const isSafe = data.status === 'SAFE'

  if (!data.hasRecordedData) {
    return (
      <section
        className="attendance-hero-card hero-empty-state"
        aria-labelledby="hero-regular-heading"
      >
        <div className="hero-eyebrow" id="hero-regular-heading">
          REGULAR ATTENDANCE
        </div>
        <div className="hero-empty-content">
          <div className="hero-empty-icon" aria-hidden="true">
            📊
          </div>
          <h2 className="hero-empty-title">No attendance recorded yet</h2>
          <p className="hero-empty-text">
            Enter your total classes held and attended to see your 75% position
            and calculate safe absences.
          </p>
          <button
            type="button"
            className="primary-button hero-cta-btn"
            onClick={onOpenUpdateSheet}
            id="hero-enter-attendance-btn"
          >
            Enter Attendance
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="attendance-hero-card" aria-labelledby="hero-regular-heading">
      <div className="hero-header-row">
        <div className="hero-eyebrow" id="hero-regular-heading">
          REGULAR ATTENDANCE
        </div>
        <button
          type="button"
          className="text-action-link"
          onClick={onOpenUpdateSheet}
          aria-label="Edit regular attendance totals"
          id="hero-edit-link"
        >
          Edit totals
        </button>
      </div>

      <div className="hero-percentage-wrap">
        <span className="hero-percentage-value" id="hero-percentage-display">
          {formatPercent(data.percentage)}
        </span>
      </div>

      <div className="hero-counts">
        <span className="counts-primary">
          <strong>{data.attended}</strong> / <strong>{data.held}</strong> classes
        </span>
        <span className="counts-separator">·</span>
        <span className="counts-secondary">{data.absent} absent</span>
      </div>

      <div className="hero-status-row">
        <StatusIndicator
          status={data.status}
          size="lg"
        />
      </div>

      {/* Subtle restrained progress visualization */}
      <div className="hero-progress-container" aria-hidden="true">
        <div className="progress-labels">
          <span>0%</span>
          <span className="target-tick-label" style={{ left: '75%' }}>
            75% target
          </span>
          <span>100%</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${isSafe ? 'fill-safe' : 'fill-danger'}`}
            style={{ width: `${Math.min(100, Math.max(0, data.percentage))}%` }}
          />
          <div
            className="target-threshold-line"
            style={{ left: '75%' }}
            title="75% Attendance Requirement"
          />
          <div
            className="current-position-dot"
            style={{ left: `${Math.min(100, Math.max(0, data.percentage))}%` }}
            title={`Current: ${data.percentage.toFixed(2)}%`}
          />
        </div>
      </div>
    </section>
  )
}
