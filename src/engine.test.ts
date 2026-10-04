import { describe, expect, it } from 'vitest'
import {
  calculateAfterAbsence,
  calculateAfterAttendance,
  calculateAttendance,
  calculateClassesNeeded,
  calculateExpectedFinal,
  calculateSafeAbsences,
  calculateTargetReachability,
} from './engine'

describe('attendance math engine', () => {
  it('calculates current attendance for common values', () => {
    expect(calculateAttendance(1, 1)).toBe(100)
    expect(calculateAttendance(0, 10)).toBe(0)
    expect(calculateAttendance(5, 10)).toBe(50)
    expect(calculateAttendance(75, 100)).toBe(75)
    expect(calculateAttendance(208, 244)).toBeCloseTo(85.2459016393, 10)
  })

  it('handles single-class impact accurately', () => {
    expect(calculateAfterAttendance(84, 100, 1)).toBeCloseTo(84.1584158416, 10)
    expect(calculateAfterAbsence(84, 100, 1)).toBeCloseTo(83.1683168317, 10)
  })

  it('handles multiple-class impact and mixed scenarios', () => {
    expect(calculateAfterAttendance(40, 50, 10)).toBeCloseTo(50, 10)
    expect(calculateAfterAbsence(40, 50, 10)).toBeCloseTo((40 / 60) * 100, 10)
    expect(calculateExpectedFinal(40, 50, 10, 80)).toBeCloseTo(80, 10)
  })

  it('calculates target recovery classes and safe absence count', () => {
    expect(calculateClassesNeeded(50, 100, 75)).toBe(100)
    expect(calculateClassesNeeded(80, 100, 75)).toBe(0)
    expect(calculateClassesNeeded(90, 100, 100)).toBeNull()
    expect(calculateSafeAbsences(75, 100, 75)).toBe(0)
    expect(calculateSafeAbsences(60, 80, 75)).toBe(0)
    expect(calculateSafeAbsences(50, 80, 75)).toBe(0)
  })

  it('handles impossible and exact target states', () => {
    expect(calculateClassesNeeded(90, 100, 95)).toBe(100)
    expect(calculateTargetReachability(70, 100, 90, 20)).toEqual({
      maxPossible: 75,
      minRemainingToAttend: null,
      reachable: false,
    })
  })

  it('keeps percentages finite under zero and invalid inputs', () => {
    expect(calculateAttendance(0, 0)).toBe(0)
    expect(calculateAttendance(-5, 10)).toBe(0)
    expect(calculateAfterAbsence(50, 0, 10)).toBe(0)
    expect(calculateAfterAttendance(5, 0, 10)).toBe(60)
  })
})
