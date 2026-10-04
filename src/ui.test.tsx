import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { App } from './App'
import { AttendanceHero } from './components/AttendanceHero'
import { TargetSafety } from './components/TargetSafety'
import { WhatHappensNext } from './components/WhatHappensNext'
import { EcaSection } from './components/EcaSection'
import { UpdateAttendanceSheet } from './components/UpdateAttendanceSheet'
import {
  calculateCategoryAttendance,
  calculateCustomWhatIf,
  calculateScenario,
  validateAttendanceInput,
} from './engine'
import {
  clearStoredAttendanceState,
  loadStoredAttendanceState,
  saveStoredAttendanceState,
} from './utils/storage'

const getCleanHtml = (element: React.ReactElement): string => {
  return renderToString(element).replace(/<!-- -->/g, '')
}

describe('ATTEND Prompt 04 Live Integration Tests', () => {
  /* ============================================================
     1. Initial Regular Attendance Renders Correctly
     ============================================================ */
  it('1. Initial Regular Attendance: 208 / 244 yields 85.25%, SAFE, and 33 safe absences', () => {
    const regular = calculateCategoryAttendance('REGULAR', 208, 244, 75)

    expect(regular.percentage).toBe(85.25)
    expect(regular.status).toBe('SAFE')
    expect(regular.safeAbsences).toBe(33)
    expect(regular.boundarySafe.absences).toBe(33)
    expect(regular.boundarySafe.percentage).toBe(75.09)
    expect(regular.boundaryFail.absences).toBe(34)
    expect(regular.boundaryFail.percentage).toBe(74.82)

    const heroHtml = getCleanHtml(
      <AttendanceHero data={regular} onOpenUpdateSheet={() => {}} />,
    )
    expect(heroHtml).toContain('85.25%')
    expect(heroHtml).toContain('208')
    expect(heroHtml).toContain('244')
    expect(heroHtml).toContain('classes')
    expect(heroHtml).toContain('SAFE')

    const safetyHtml = getCleanHtml(<TargetSafety data={regular} />)
    expect(safetyHtml).toContain('You can miss')
    expect(safetyHtml).toContain('33')
    expect(safetyHtml).toContain('more classes and stay at or above 75%')
  })

  /* ============================================================
     2. Initial ECE/ECA Renders Correctly
     ============================================================ */
  it('2. Initial ECE/ECA: 10 / 10 yields 100.00%, SAFE, and 3 safe absences', () => {
    const ece = calculateCategoryAttendance('ECE', 10, 10, 75)

    expect(ece.percentage).toBe(100.0)
    expect(ece.status).toBe('SAFE')
    expect(ece.safeAbsences).toBe(3) // 10/13 = 76.92% >= 75%, 10/14 = 71.43% < 75%

    const eceHtml = getCleanHtml(
      <EcaSection data={ece} onOpenUpdateSheet={() => {}} />,
    )
    expect(eceHtml).toContain('100.00%')
    expect(eceHtml).toContain('10')
    expect(eceHtml).toContain('SAFE')
    expect(eceHtml).toContain('You can miss')
    expect(eceHtml).toContain('3')
    expect(eceHtml).toContain('more classes')
  })

  /* ============================================================
     3. Updating Regular Changes Derived Values
     ============================================================ */
  it('3. Updating Regular: e.g. 100 held, 72 attended immediately calculates 72.00% and 12 recovery classes', () => {
    const deficitData = calculateCategoryAttendance('REGULAR', 72, 100, 75)

    expect(deficitData.percentage).toBe(72.0)
    expect(deficitData.status).toBe('BELOW TARGET')
    expect(deficitData.safeAbsences).toBe(0)
    expect(deficitData.recoveryClasses).toBe(12)

    const safetyHtml = getCleanHtml(<TargetSafety data={deficitData} />)
    expect(safetyHtml).toContain('You need to attend')
    expect(safetyHtml).toContain('12')
    expect(safetyHtml).toContain('consecutive classes to reach 75%')
  })

  /* ============================================================
     4. Updating ECE/ECA Does Not Affect Regular (and vice versa)
     ============================================================ */
  it('4. Category Isolation: Regular and ECE/ECA remain completely independent and are never pooled', () => {
    const regular1 = calculateCategoryAttendance('REGULAR', 208, 244, 75)
    const ece1 = calculateCategoryAttendance('ECE', 10, 10, 75)
    expect(regular1.percentage).toBe(85.25)
    expect(ece1.percentage).toBe(100.0)

    // Update Regular only
    const regular2 = calculateCategoryAttendance('REGULAR', 240, 300, 75)
    expect(regular2.percentage).toBe(80.0)
    expect(regular2.safeAbsences).toBe(20)
    // ECE must remain completely untouched
    expect(ece1.percentage).toBe(100.0)
    expect(ece1.attended).toBe(10)
    expect(ece1.held).toBe(10)

    // Update ECE only
    const ece2 = calculateCategoryAttendance('ECE', 12, 15, 75)
    expect(ece2.percentage).toBe(80.0)
    // Regular must remain completely untouched
    expect(regular2.percentage).toBe(80.0)
    expect(regular2.attended).toBe(240)
    expect(regular2.held).toBe(300)
  })

  /* ============================================================
     5. Attend-All Scenario Works
     ============================================================ */
  it('5. Attend-All: Calculates Attend next 5 (213 / 249, 85.54%, SAFE)', () => {
    const regular = calculateCategoryAttendance('REGULAR', 208, 244, 75)
    const outcome = calculateScenario(regular.attended, regular.held, 5)

    expect(outcome.attendAllPercentage).toBe(85.54)
    expect(outcome.attendAllDiff).toBe(0.29)

    const html = getCleanHtml(<WhatHappensNext data={regular} />)
    expect(html).toContain('NEXT CLASS')
    expect(html).toContain('85.31%')
  })

  /* ============================================================
     6. Miss-All Scenario Works
     ============================================================ */
  it('6. Miss-All: Calculates Miss next 5 (208 / 249, 83.53%, SAFE)', () => {
    const regular = calculateCategoryAttendance('REGULAR', 208, 244, 75)
    const outcome = calculateScenario(regular.attended, regular.held, 5)

    expect(outcome.missAllPercentage).toBe(83.53)
    expect(outcome.missAllDiff).toBe(-1.72)
  })

  /* ============================================================
     7. Custom Scenario Works
     ============================================================ */
  it('7. Custom Scenario: Calculates 6 upcoming, 4 attended, 2 missed -> 212 / 250, 84.80%, SAFE', () => {
    const whatIf = calculateCustomWhatIf(208, 244, 6, 4, 2, 75)

    expect(whatIf.isValid).toBe(true)
    expect(whatIf.projectedPercentage).toBe(84.8)
    expect(whatIf.diff).toBeCloseTo(-0.45, 1)
    expect(whatIf.status).toBe('SAFE')
  })

  /* ============================================================
     8. Invalid Inputs Are Rejected
     ============================================================ */
  it('8. Validation: Rejects attended > held in update sheet and attend + miss > upcoming in custom what-if', () => {
    // A. Update Attendance validation (attended > held)
    const validationExceeded = validateAttendanceInput(20, 25)
    expect(validationExceeded.isValid).toBe(false)
    expect(validationExceeded.error).toBe(
      'Attended classes cannot be greater than classes held.',
    )

    const sheetHtml = getCleanHtml(
      <UpdateAttendanceSheet
        isOpen={true}
        onClose={() => {}}
        currentInputs={{
          regularHeld: 20,
          regularAttended: 25,
          eceHeld: 10,
          eceAttended: 10,
        }}
        onSave={() => {}}
      />,
    )
    expect(sheetHtml).toContain('Attended classes cannot be greater than classes held.')

    // B. Custom Scenario validation (attend + miss > upcoming)
    const customInvalid = calculateCustomWhatIf(208, 244, 5, 4, 3, 75)
    expect(customInvalid.isValid).toBe(false)
    expect(customInvalid.errorMessage).toBe(
      'Attend + Miss cannot exceed upcoming classes.',
    )
  })

  /* ============================================================
     9. Persistence Survives Reload
     ============================================================ */
  it('9. Persistence: Saves state to localStorage and reloads intact', () => {
    clearStoredAttendanceState()
    expect(loadStoredAttendanceState()).toBeNull()

    const testState = {
      regularHeld: 300,
      regularAttended: 240,
      eceHeld: 15,
      eceAttended: 12,
    }

    const saved = saveStoredAttendanceState(testState)
    expect(saved).toBe(true)

    const loaded = loadStoredAttendanceState()
    expect(loaded).not.toBeNull()
    expect(loaded?.inputs.regularHeld).toBe(300)
    expect(loaded?.inputs.regularAttended).toBe(240)
    expect(loaded?.inputs.eceHeld).toBe(15)
    expect(loaded?.inputs.eceAttended).toBe(12)

    // Derived values verify cleanly
    const reloadedReg = calculateCategoryAttendance(
      'REGULAR',
      loaded!.inputs.regularAttended,
      loaded!.inputs.regularHeld,
      75,
    )
    expect(reloadedReg.percentage).toBe(80.0)
    expect(reloadedReg.safeAbsences).toBe(20)

    clearStoredAttendanceState()
  })

  /* ============================================================
     10. Zero-Data State Renders Safely
     ============================================================ */
  it('10. Zero-Data State: 0 held, 0 attended renders friendly empty state without NaN or Infinity', () => {
    const zeroData = calculateCategoryAttendance('REGULAR', 0, 0, 75)

    expect(zeroData.hasRecordedData).toBe(false)
    expect(zeroData.percentage).toBe(0)

    const heroHtml = getCleanHtml(
      <AttendanceHero data={zeroData} onOpenUpdateSheet={() => {}} />,
    )
    expect(heroHtml).toContain('No attendance recorded yet')
    expect(heroHtml).not.toContain('NaN')
    expect(heroHtml).not.toContain('Infinity')
  })

  /* ============================================================
     Full App Verification (Zero Subject/Timetable UI remnants)
     ============================================================ */
  it('Full App renders primary single screen without subject cards or subject pages', () => {
    const html = getCleanHtml(<App />)

    expect(html).toContain('ATTEND')
    expect(html).toContain('REGULAR ATTENDANCE')
    expect(html).toContain('85.25%')
    expect(html).toContain('208')
    expect(html).toContain('244')
    expect(html).toContain('75% TARGET')
    expect(html).toContain('WHAT HAPPENS NEXT?')
    expect(html).toContain('ECE / ECA ATTENDANCE')
    expect(html).toContain('100.00%')

    // Absolutely NO subject remnants
    expect(html).not.toContain('All Subjects')
    expect(html).not.toContain('Needs attention')
    expect(html).not.toContain('OOPLab')
    expect(html).not.toContain('P&amp;S')
  })
})
