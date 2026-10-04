import React, { useState, useEffect, useMemo } from 'react'
import './App.css'
import type { AttendanceInputState } from './types'
import { initialAttendanceInputs } from './data/initialData'
import {
  clearStoredAttendanceState,
  loadStoredAttendanceState,
  saveStoredAttendanceState,
} from './utils/storage'
import { calculateCategoryAttendance } from './engine'
import { Header } from './components/Header'
import { AttendanceHero } from './components/AttendanceHero'
import { TargetSafety } from './components/TargetSafety'
import { WhatHappensNext } from './components/WhatHappensNext'
import { EcaSection } from './components/EcaSection'
import { UpdateAttendanceSheet } from './components/UpdateAttendanceSheet'

export const App: React.FC = () => {
  // Load initial inputs from localStorage or default baseline
  const storedState = useMemo(() => loadStoredAttendanceState(), [])

  const [inputs, setInputs] = useState<AttendanceInputState>(
    () => storedState?.inputs || initialAttendanceInputs,
  )

  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Save changes to localStorage whenever inputs change
  useEffect(() => {
    saveStoredAttendanceState(inputs)
  }, [inputs])

  // Derive pure calculated data using the engine
  const regularData = useMemo(() => {
    return calculateCategoryAttendance(
      'REGULAR',
      inputs.regularAttended,
      inputs.regularHeld,
      75,
    )
  }, [inputs.regularAttended, inputs.regularHeld])

  const eceData = useMemo(() => {
    return calculateCategoryAttendance(
      'ECE',
      inputs.eceAttended,
      inputs.eceHeld,
      75,
    )
  }, [inputs.eceAttended, inputs.eceHeld])

  const handleOpenUpdateSheet = () => {
    setIsUpdateSheetOpen(true)
  }

  const handleCloseUpdateSheet = () => {
    setIsUpdateSheetOpen(false)
  }

  const handleSaveInputs = (newInputs: AttendanceInputState) => {
    setInputs(newInputs)
    saveStoredAttendanceState(newInputs)
    setToastMessage('Attendance updated successfully.')
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleResetToBaseline = () => {
    clearStoredAttendanceState()
    setInputs(initialAttendanceInputs)
    saveStoredAttendanceState(initialAttendanceInputs)
    setToastMessage('Reset to baseline (208 / 244 regular, 10 / 10 ECE).')
    setTimeout(() => setToastMessage(null), 4000)
  }

  const isZeroState = inputs.regularHeld === 0 && inputs.eceHeld === 0

  return (
    <div className="app-viewport">
      <main className="app-shell" id="main-content">
        {/* Floating notification */}
        {toastMessage && (
          <div className="app-toast-banner" role="status" aria-live="polite">
            <span className="toast-text">{toastMessage}</span>
            <button
              type="button"
              className="toast-dismiss-btn"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Header */}
        <Header onOpenUpdateSheet={handleOpenUpdateSheet} />

        {/* First time / Zero state onboarding if no attendance recorded */}
        {isZeroState ? (
          <section className="app-card onboarding-card" aria-labelledby="onboarding-title">
            <div className="onboarding-badge">GET STARTED</div>
            <h2 className="onboarding-title" id="onboarding-title">
              Welcome to ATTEND
            </h2>
            <p className="onboarding-subtitle">
              Enter your current attendance numbers to instantly know if you're safe
              at 75% and calculate upcoming class scenarios.
            </p>
            <button
              type="button"
              className="primary-button onboarding-cta-btn"
              onClick={handleOpenUpdateSheet}
              id="onboarding-enter-btn"
            >
              Calculate My Attendance
            </button>
          </section>
        ) : (
          <>
            {/* 2. REGULAR Attendance Hero (Dominant Percentage & Status) */}
            <AttendanceHero
              data={regularData}
              onOpenUpdateSheet={handleOpenUpdateSheet}
            />

            {/* 3. 75% Target & Safe Absences Buffer / Recovery Requirement */}
            <TargetSafety data={regularData} />

            {/* 4. What Happens Next? (Presets 1, 3, 5, 10 & Custom What-If) */}
            <WhatHappensNext data={regularData} />

            {/* 5. ECE / ECA Attendance (Completely Separate Secondary Section) */}
            <EcaSection
              data={eceData}
              onOpenUpdateSheet={handleOpenUpdateSheet}
            />
          </>
        )}

        {/* Update attendance action button */}
        <div className="update-cta-container">
          <button
            type="button"
            className="update-action-btn"
            onClick={handleOpenUpdateSheet}
            id="bottom-update-attendance-btn"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Update Attendance</span>
          </button>
        </div>

        {/* Subtle footer */}
        <footer className="app-footer">
          <span>ATTEND · Personal attendance companion</span>
          <button
            type="button"
            className="footer-reset-btn"
            onClick={handleResetToBaseline}
            id="reset-baseline-btn"
            title="Reset to 208/244 regular and 10/10 ECE baseline"
          >
            Reset to Baseline
          </button>
        </footer>
      </main>

      {/* Update Attendance Bottom Sheet */}
      <UpdateAttendanceSheet
        key={String(isUpdateSheetOpen)}
        isOpen={isUpdateSheetOpen}
        onClose={handleCloseUpdateSheet}
        currentInputs={inputs}
        onSave={handleSaveInputs}
      />
    </div>
  )
}

export default App
