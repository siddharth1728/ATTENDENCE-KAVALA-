import React from 'react'
import type { CategoryAttendance } from '../types'
import { formatPercent } from '../engine'

interface TargetSafetyProps {
  data: CategoryAttendance
}

export const TargetSafety: React.FC<TargetSafetyProps> = ({ data }) => {
  if (!data.hasRecordedData) {
    return null
  }

  const isSafe = data.status === 'SAFE'

  // Visual marker position between 10% and 90% for gauge display
  const markerPosition = Math.max(
    12,
    Math.min(88, 50 + (data.percentage - data.target) * 2.2),
  )

  return (
    <section className="app-card target-safety-card" aria-labelledby="target-safety-heading">
      <div className="section-eyebrow" id="target-safety-heading">
        75% TARGET
      </div>

      <div className="buffer-headline">
        {isSafe ? (
          data.safeAbsences > 0 ? (
            <>
              You can miss <span className="highlight-buffer">{data.safeAbsences}</span> more classes and stay at or above 75%.
            </>
          ) : (
            <span className="text-warning">
              You cannot miss another class without falling below 75%.
            </span>
          )
        ) : (
          <>
            You need to attend <span className="highlight-recovery text-danger">{data.recoveryClasses}</span> consecutive classes to reach 75%.
          </>
        )}
      </div>

      {/* Visual Safety Indicator Diagram */}
      <div className="safety-diagram" aria-label="Attendance safety position visualization">
        <div className="diagram-track">
          {/* Target 75% Line (centered at 50%) */}
          <div className="diagram-target-mark" style={{ left: '50%' }}>
            <span className="diagram-mark-line" />
            <span className="diagram-mark-text">75% Target</span>
          </div>

          {/* Current Position Marker */}
          <div className="diagram-user-mark" style={{ left: `${markerPosition}%` }}>
            <div className={`diagram-dot-pulse ${isSafe ? 'safe' : 'danger'}`} />
            <div className="diagram-user-label">
              <span className={`diagram-user-here ${isSafe ? 'safe' : 'danger'}`}>
                YOU ARE HERE
              </span>
              <strong className="diagram-user-pct">{formatPercent(data.percentage)}</strong>
            </div>
          </div>
        </div>

        <div className="buffer-chip-row">
          {isSafe ? (
            <span className="buffer-pill">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <strong>{data.safeAbsences} classes</strong> of buffer
            </span>
          ) : (
            <span className="buffer-pill deficit">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <strong>{data.recoveryClasses} classes</strong> to reach 75%
            </span>
          )}
        </div>
      </div>

      {/* Boundary Callout Details */}
      <div className="boundary-details">
        {isSafe ? (
          <>
            <div className="boundary-item boundary-safe">
              <div className="boundary-indicator-dot safe" aria-hidden="true" />
              <div className="boundary-text">
                <span className="boundary-rule">{data.boundarySafe.absences} more absences</span>
                <span className="boundary-arrow">→</span>
                <strong className="boundary-result">{formatPercent(data.boundarySafe.percentage)}</strong>
              </div>
              <span className="boundary-badge safe">Safe</span>
            </div>

            <div className="boundary-item boundary-fail">
              <div className="boundary-indicator-dot danger" aria-hidden="true" />
              <div className="boundary-text">
                <span className="boundary-rule">{data.boundaryFail.absences} more absences</span>
                <span className="boundary-arrow">→</span>
                <strong className="boundary-result">{formatPercent(data.boundaryFail.percentage)}</strong>
              </div>
              <span className="boundary-badge danger">Crosses 75%</span>
            </div>
          </>
        ) : (
          <div className="boundary-item boundary-fail">
            <div className="boundary-indicator-dot danger" aria-hidden="true" />
            <div className="boundary-text">
              <span className="boundary-rule">Attend {data.recoveryClasses} consecutive classes</span>
              <span className="boundary-arrow">→</span>
              <strong className="boundary-result">≥ 75.00%</strong>
            </div>
            <span className="boundary-badge safe">Target Met</span>
          </div>
        )}
      </div>
    </section>
  )
}
