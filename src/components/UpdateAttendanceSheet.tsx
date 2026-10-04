import React, { useEffect, useState } from 'react'
import type { AttendanceInputState } from '../types'
import { calculateAttendance, formatPercent, validateAttendanceInput } from '../engine'

interface UpdateAttendanceSheetProps {
  isOpen: boolean
  onClose: () => void
  currentInputs: AttendanceInputState
  onSave: (newInputs: AttendanceInputState) => void
}

export const UpdateAttendanceSheet: React.FC<UpdateAttendanceSheetProps> = ({
  isOpen,
  onClose,
  currentInputs,
  onSave,
}) => {
  const [regularHeld, setRegularHeld] = useState<string>(String(currentInputs.regularHeld))
  const [regularAttended, setRegularAttended] = useState<string>(String(currentInputs.regularAttended))
  const [eceHeld, setEceHeld] = useState<string>(String(currentInputs.eceHeld))
  const [eceAttended, setEceAttended] = useState<string>(String(currentInputs.eceAttended))

  // Keyboard navigation & accessibility: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const numRegHeld = parseInt(regularHeld, 10) || 0
  const numRegAttended = parseInt(regularAttended, 10) || 0
  const numEceHeld = parseInt(eceHeld, 10) || 0
  const numEceAttended = parseInt(eceAttended, 10) || 0

  const regValidation = validateAttendanceInput(numRegHeld, numRegAttended)
  const eceValidation = validateAttendanceInput(numEceHeld, numEceAttended)

  const isValid = regValidation.isValid && eceValidation.isValid

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    onSave({
      regularHeld: numRegHeld,
      regularAttended: numRegAttended,
      eceHeld: numEceHeld,
      eceAttended: numEceAttended,
    })
    onClose()
  }

  const previewRegPct = numRegHeld > 0 ? calculateAttendance(numRegAttended, numRegHeld) : 0
  const previewEcePct = numEceHeld > 0 ? calculateAttendance(numEceAttended, numEceHeld) : 0

  return (
    <div
      className="bottom-sheet-overlay sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        className="bottom-sheet-content update-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-sheet-title"
      >
        <div className="sheet-drag-handle-wrap" aria-hidden="true">
          <div className="sheet-drag-handle" />
        </div>

        <div className="sheet-header">
          <div className="sheet-title-group">
            <h2 className="sheet-title" id="update-sheet-title">
              Update Attendance
            </h2>
            <p className="sheet-subtitle">
              Enter your aggregate attendance totals for Regular and ECE/ECA.
            </p>
          </div>
          <button
            type="button"
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="Close update attendance sheet"
            id="close-update-sheet-btn"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="update-sheet-form">
          {/* REGULAR ATTENDANCE SECTION */}
          <div className="update-form-section">
            <div className="section-label-row">
              <span className="form-category-title">REGULAR ATTENDANCE</span>
              {numRegHeld > 0 && regValidation.isValid && (
                <span
                  className={`preview-badge ${previewRegPct >= 75 ? 'safe' : 'danger'}`}
                >
                  {formatPercent(previewRegPct)}
                </span>
              )}
            </div>

            <div className="form-inputs-grid">
              <div className="form-field">
                <label htmlFor="reg-held-input" className="form-label">
                  Total classes held
                </label>
                <input
                  id="reg-held-input"
                  type="number"
                  min="0"
                  required
                  className="sheet-input-field"
                  value={regularHeld}
                  onChange={(e) => setRegularHeld(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-attended-input" className="form-label">
                  Total classes attended
                </label>
                <input
                  id="reg-attended-input"
                  type="number"
                  min="0"
                  required
                  className="sheet-input-field"
                  value={regularAttended}
                  onChange={(e) => setRegularAttended(e.target.value)}
                />
              </div>
            </div>

            {!regValidation.isValid && (
              <div className="form-field-error" role="alert">
                <span className="error-icon" aria-hidden="true">
                  ⚠️
                </span>
                <span>{regValidation.error}</span>
              </div>
            )}
          </div>

          <div className="form-section-divider" />

          {/* ECE / ECA ATTENDANCE SECTION */}
          <div className="update-form-section">
            <div className="section-label-row">
              <span className="form-category-title">ECE / ECA ATTENDANCE</span>
              {numEceHeld > 0 && eceValidation.isValid && (
                <span
                  className={`preview-badge ${previewEcePct >= 75 ? 'safe' : 'danger'}`}
                >
                  {formatPercent(previewEcePct)}
                </span>
              )}
            </div>

            <div className="form-inputs-grid">
              <div className="form-field">
                <label htmlFor="ece-held-input" className="form-label">
                  Total classes held
                </label>
                <input
                  id="ece-held-input"
                  type="number"
                  min="0"
                  required
                  className="sheet-input-field"
                  value={eceHeld}
                  onChange={(e) => setEceHeld(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="ece-attended-input" className="form-label">
                  Total classes attended
                </label>
                <input
                  id="ece-attended-input"
                  type="number"
                  min="0"
                  required
                  className="sheet-input-field"
                  value={eceAttended}
                  onChange={(e) => setEceAttended(e.target.value)}
                />
              </div>
            </div>

            {!eceValidation.isValid && (
              <div className="form-field-error" role="alert">
                <span className="error-icon" aria-hidden="true">
                  ⚠️
                </span>
                <span>{eceValidation.error}</span>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="sheet-actions-row">
            <button
              type="button"
              className="sheet-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sheet-save-btn"
              disabled={!isValid}
              id="save-attendance-btn"
            >
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
