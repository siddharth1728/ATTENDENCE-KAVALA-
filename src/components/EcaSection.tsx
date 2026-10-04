import React from 'react'
import type { CategoryAttendance } from '../types'
import { StatusIndicator } from './StatusIndicator'
import { formatPercent } from '../engine'

interface EcaSectionProps {
  data: CategoryAttendance
  onOpenUpdateSheet: () => void
}

export const EcaSection: React.FC<EcaSectionProps> = ({
  data,
  onOpenUpdateSheet,
}) => {
  const isSafe = data.status === 'SAFE'

  if (!data.hasRecordedData) {
    return (
      <section className="app-card eca-card" aria-labelledby="eca-heading">
        <div className="section-header-row">
          <div className="section-eyebrow" id="eca-heading">
            ECE / ECA ATTENDANCE
          </div>
          <span className="eca-badge">Independent Category</span>
        </div>
        <div className="eca-empty-row">
          <p className="eca-empty-text">No ECE/ECA attendance recorded yet.</p>
          <button
            type="button"
            className="text-action-link"
            onClick={onOpenUpdateSheet}
          >
            Add totals
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="app-card eca-card" aria-labelledby="eca-heading">
      <div className="section-header-row">
        <div className="section-eyebrow" id="eca-heading">
          ECE / ECA ATTENDANCE
        </div>
        <span className="eca-badge">Independent Category</span>
      </div>

      <div className="eca-content-row">
        <div className="eca-left">
          <div className="eca-title-group">
            <span className="eca-name">ECE / ECA Attendance</span>
            <button
              type="button"
              className="text-action-link edit-secondary-btn"
              onClick={onOpenUpdateSheet}
              aria-label="Edit ECE attendance"
            >
              Edit
            </button>
          </div>
          <div className="eca-meta">
            <strong>{data.attended}</strong> / <strong>{data.held}</strong> classes
            <span className="meta-separator">·</span>
            <span>{data.absent} absent</span>
          </div>
        </div>

        <div className="eca-right">
          <span
            className={`eca-pct ${isSafe ? 'text-safe' : 'text-danger'}`}
            id="eca-percentage-display"
          >
            {formatPercent(data.percentage)}
          </span>
          <StatusIndicator status={data.status} size="sm" />
        </div>
      </div>

      {/* Independent safe buffer or recovery */}
      <div className="eca-buffer-callout">
        {isSafe ? (
          data.safeAbsences > 0 ? (
            <span className="eca-buffer-text" id="eca-safe-buffer-text">
              You can miss <strong>{data.safeAbsences}</strong> more classes.
            </span>
          ) : (
            <span className="eca-buffer-text text-warning" id="eca-safe-buffer-text">
              Cannot miss another class without dropping below 75%.
            </span>
          )
        ) : (
          <span className="eca-buffer-text text-danger" id="eca-recovery-text">
            Attend <strong>{data.recoveryClasses}</strong> upcoming classes to reach 75%.
          </span>
        )}
      </div>

      {/* Quick upcoming class preview */}
      <div className="eca-quick-scenarios">
        <div className="eca-scenario-pill">
          <span className="scenario-label">If miss next class:</span>
          <span className="scenario-value" id="eca-next-miss-value">
            {formatPercent(data.nextMissPercentage)} ({data.attended} / {data.held + 1})
          </span>
        </div>
        <div className="eca-scenario-pill">
          <span className="scenario-label">If attend next class:</span>
          <span className="scenario-value" id="eca-next-attend-value">
            {formatPercent(data.nextAttendPercentage)} ({data.attended + 1} / {data.held + 1})
          </span>
        </div>
      </div>

      <div className="eca-notice">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          ECE/ECA attendance is kept strictly independent and is never added to regular attendance.
        </span>
      </div>
    </section>
  )
}
