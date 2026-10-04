import { describe, expect, it } from 'vitest'
import {
  calculateAttendance,
  calculateCategoryAttendance,
  calculateCustomWhatIf,
  calculateRecoveryClasses,
  calculateSafeAbsences,
  calculateScenario,
  deriveStatus,
  validateAttendanceInput,
} from './engine'

describe('ATTEND Aggregate Math Engine', () => {
  it('calculates current attendance accurately', () => {
    expect(calculateAttendance(1, 1)).toBe(100)
    expect(calculateAttendance(0, 10)).toBe(0)
    expect(calculateAttendance(5, 10)).toBe(50)
    expect(calculateAttendance(75, 100)).toBe(75)
    expect(calculateAttendance(208, 244)).toBeCloseTo(85.2459016393, 10)
  })

  it('calculates safe absences correctly for 208 / 244 (33 classes)', () => {
    // Current: 208 / 244 = 85.25%
    const safe = calculateSafeAbsences(208, 244, 75)
    expect(safe).toBe(33)

    // After 33 absences: 208 / 277 = 75.09% (Safe)
    expect(calculateAttendance(208, 244 + 33)).toBeCloseTo(75.09025, 4)

    // After 34 absences: 208 / 278 = 74.82% (Below target)
    expect(calculateAttendance(208, 244 + 34)).toBeCloseTo(74.82014, 4)
  })

  it('calculates recovery classes for 72 / 100 (12 consecutive classes needed)', () => {
    // Current: 72 / 100 = 72% (below 75%)
    const recovery = calculateRecoveryClasses(72, 100, 75)
    expect(recovery).toBe(12)

    // After 12 consecutive attended classes: 84 / 112 = 75.00%
    expect(calculateAttendance(72 + 12, 100 + 12)).toBe(75.0)

    // Safe absences should be 0 when below target
    expect(calculateSafeAbsences(72, 100, 75)).toBe(0)
  })

  it('handles exact 75.00% as SAFE with 0 safe absences and 0 recovery', () => {
    expect(deriveStatus(75.0, 75)).toBe('SAFE')
    expect(deriveStatus(74.99, 75)).toBe('BELOW TARGET')
    expect(calculateSafeAbsences(75, 100, 75)).toBe(0)
    expect(calculateRecoveryClasses(75, 100, 75)).toBe(0)
  })

  it('calculates next 1 class scenarios: attend 85.31%, miss 84.90%', () => {
    const next1 = calculateScenario(208, 244, 1)
    expect(next1.attendAllPercentage).toBe(85.31)
    expect(next1.missAllPercentage).toBe(84.9)
    expect(next1.attendAllDiff).toBe(0.06)
    expect(next1.missAllDiff).toBe(-0.35)
  })

  it('calculates next 5 classes scenarios: attend all 85.54%, miss all 83.53%', () => {
    const next5 = calculateScenario(208, 244, 5)
    expect(next5.attendAllPercentage).toBe(85.54)
    expect(next5.missAllPercentage).toBe(83.53)
    expect(next5.attendAllDiff).toBe(0.29)
    expect(next5.missAllDiff).toBe(-1.72)
  })

  it('calculates custom What-If scenario (upcoming: 6, attend: 4, miss: 2)', () => {
    // 208 + 4 = 212 attended; 244 + 6 = 250 held -> 212 / 250 = 84.80%
    const whatIf = calculateCustomWhatIf(208, 244, 6, 4, 2, 75)
    expect(whatIf.isValid).toBe(true)
    expect(whatIf.projectedPercentage).toBe(84.8)
    expect(whatIf.diff).toBeCloseTo(-0.45, 1)
    expect(whatIf.status).toBe('SAFE')
  })

  it('validates custom scenario when attend + miss exceeds upcoming', () => {
    const invalid = calculateCustomWhatIf(208, 244, 6, 5, 3, 75)
    expect(invalid.isValid).toBe(false)
    expect(invalid.errorMessage).toBe('Attend + Miss cannot exceed upcoming classes.')
  })

  it('validates input boundaries: negative numbers, attended > held', () => {
    const invalidExceeded = validateAttendanceInput(20, 25)
    expect(invalidExceeded.isValid).toBe(false)
    expect(invalidExceeded.error).toBe(
      'Attended classes cannot be greater than classes held.',
    )

    const invalidNegative = validateAttendanceInput(-5, 10)
    expect(invalidNegative.isValid).toBe(false)
    expect(invalidNegative.error).toBe('Classes cannot be negative.')

    const valid = validateAttendanceInput(244, 208)
    expect(valid.isValid).toBe(true)
  })

  it('handles zero classes held gracefully without NaN or Infinity', () => {
    expect(calculateAttendance(0, 0)).toBe(0)
    const zeroCat = calculateCategoryAttendance('REGULAR', 0, 0, 75)
    expect(zeroCat.hasRecordedData).toBe(false)
    expect(zeroCat.percentage).toBe(0)
    expect(Number.isFinite(zeroCat.percentage)).toBe(true)
  })

  it('computes 100% attendance (10/10) and next miss (10/11 -> 90.91%)', () => {
    const ece = calculateCategoryAttendance('ECE', 10, 10, 75)
    expect(ece.percentage).toBe(100.0)
    expect(ece.status).toBe('SAFE')
    expect(ece.safeAbsences).toBe(3) // 10/13 = 76.92%, 10/14 = 71.43%
    expect(ece.nextMissPercentage).toBe(90.91)
    expect(ece.nextAttendPercentage).toBe(100.0)
  })
})
