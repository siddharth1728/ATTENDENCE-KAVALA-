import type {
  AttendanceStatus,
  CategoryAttendance,
  CustomWhatIf,
  ScenarioOutcome,
} from './types'

export function sanitizeNumber(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

export function calculateAttendance(attended: number, held: number): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)

  if (safeHeld <= 0) return 0
  return (safeAttended / safeHeld) * 100
}

export function calculateAbsenceCount(attended: number, held: number): number {
  return Math.max(0, sanitizeNumber(held) - sanitizeNumber(attended))
}

export function calculateAfterAttendance(
  attended: number,
  held: number,
  futureClasses: number,
): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeFutureClasses = sanitizeNumber(futureClasses)

  if (safeHeld + safeFutureClasses <= 0) return 0
  return ((safeAttended + safeFutureClasses) / (safeHeld + safeFutureClasses)) * 100
}

export function calculateAfterAbsence(
  attended: number,
  held: number,
  futureClasses: number,
): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeFutureClasses = sanitizeNumber(futureClasses)

  if (safeHeld + safeFutureClasses <= 0) return 0
  return (safeAttended / (safeHeld + safeFutureClasses)) * 100
}

export function calculateClassesNeeded(
  attended: number,
  held: number,
  target: number = 75,
): number | null {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeTarget = sanitizeNumber(target)

  if (safeHeld <= 0) return 0
  if (safeTarget <= 0) return 0
  if (safeTarget >= 100) {
    return calculateAttendance(safeAttended, safeHeld) >= 100 ? 0 : null
  }

  const currentPercent = calculateAttendance(safeAttended, safeHeld)
  if (currentPercent >= safeTarget) return 0

  return Math.ceil((safeTarget * safeHeld - 100 * safeAttended) / (100 - safeTarget))
}

export function calculateSafeAbsences(
  attended: number,
  held: number,
  target: number = 75,
): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeTarget = sanitizeNumber(target)

  if (safeHeld <= 0 || safeTarget <= 0) return 0

  const currentPercent = calculateAttendance(safeAttended, safeHeld)
  if (currentPercent < safeTarget) return 0

  const value = (100 * safeAttended - safeTarget * safeHeld) / safeTarget
  return value <= 0 ? 0 : Math.floor(value)
}

export function calculateRecoveryClasses(
  attended: number,
  held: number,
  target: number = 75,
): number {
  const needed = calculateClassesNeeded(attended, held, target)
  return needed === null ? 0 : needed
}

export function deriveStatus(
  attendance: number,
  target: number = 75,
): AttendanceStatus {
  if (!Number.isFinite(attendance)) return 'BELOW TARGET'
  if (attendance >= target) return 'SAFE'
  return 'BELOW TARGET'
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0.00%'
  return `${value.toFixed(2)}%`
}

export function formatSignedPoints(value: number): string {
  if (!Number.isFinite(value)) return '0.00 pts'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)} pts`
}

export function calculateCategoryAttendance(
  category: 'REGULAR' | 'ECE',
  attended: number,
  held: number,
  target: number = 75,
): CategoryAttendance {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const absent = calculateAbsenceCount(safeAttended, safeHeld)

  if (safeHeld <= 0) {
    return {
      category,
      name: category === 'REGULAR' ? 'Regular Attendance' : 'ECE / ECA Attendance',
      held: 0,
      attended: 0,
      absent: 0,
      percentage: 0,
      status: 'BELOW TARGET',
      safeAbsences: 0,
      recoveryClasses: 0,
      target,
      boundarySafe: { absences: 0, percentage: 0 },
      boundaryFail: { absences: 0, percentage: 0 },
      nextAttendPercentage: 0,
      nextMissPercentage: 0,
      hasRecordedData: false,
    }
  }

  const rawPercentage = calculateAttendance(safeAttended, safeHeld)
  const percentage = Number(rawPercentage.toFixed(2))
  const status = deriveStatus(rawPercentage, target)
  const safeAbsences = calculateSafeAbsences(safeAttended, safeHeld, target)
  const recoveryClasses = calculateRecoveryClasses(safeAttended, safeHeld, target)

  const boundarySafePct = calculateAttendance(safeAttended, safeHeld + safeAbsences)
  const boundaryFailPct = calculateAttendance(safeAttended, safeHeld + safeAbsences + 1)

  const nextAttendPercentage = calculateAfterAttendance(safeAttended, safeHeld, 1)
  const nextMissPercentage = calculateAfterAbsence(safeAttended, safeHeld, 1)

  return {
    category,
    name: category === 'REGULAR' ? 'Regular Attendance' : 'ECE / ECA Attendance',
    held: safeHeld,
    attended: safeAttended,
    absent,
    percentage,
    status,
    safeAbsences,
    recoveryClasses,
    target,
    boundarySafe: {
      absences: safeAbsences,
      percentage: Number(boundarySafePct.toFixed(2)),
    },
    boundaryFail: {
      absences: safeAbsences + 1,
      percentage: Number(boundaryFailPct.toFixed(2)),
    },
    nextAttendPercentage: Number(nextAttendPercentage.toFixed(2)),
    nextMissPercentage: Number(nextMissPercentage.toFixed(2)),
    hasRecordedData: true,
  }
}

export function calculateScenario(
  attended: number,
  held: number,
  classesCount: number,
): ScenarioOutcome {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeClasses = Math.max(1, sanitizeNumber(classesCount))

  if (safeHeld <= 0) {
    return {
      classes: safeClasses,
      attendAllPercentage: 0,
      missAllPercentage: 0,
      attendAllDiff: 0,
      missAllDiff: 0,
    }
  }

  const currentDisplayPct = Number(
    calculateAttendance(safeAttended, safeHeld).toFixed(2),
  )
  const attendAllPct = Number(
    calculateAfterAttendance(safeAttended, safeHeld, safeClasses).toFixed(2),
  )
  const missAllPct = Number(
    calculateAfterAbsence(safeAttended, safeHeld, safeClasses).toFixed(2),
  )

  return {
    classes: safeClasses,
    attendAllPercentage: attendAllPct,
    missAllPercentage: missAllPct,
    attendAllDiff: Number((attendAllPct - currentDisplayPct).toFixed(2)),
    missAllDiff: Number((missAllPct - currentDisplayPct).toFixed(2)),
  }
}

export function calculateCustomWhatIf(
  attended: number,
  held: number,
  upcoming: number,
  attend: number,
  miss: number,
  target: number = 75,
): CustomWhatIf {
  if (upcoming < 0 || attend < 0 || miss < 0) {
    return {
      upcoming,
      attend,
      miss,
      projectedPercentage: 0,
      diff: 0,
      status: 'BELOW TARGET',
      isValid: false,
      errorMessage: 'Values cannot be negative.',
    }
  }

  if (attend + miss > upcoming) {
    return {
      upcoming,
      attend,
      miss,
      projectedPercentage: 0,
      diff: 0,
      status: 'BELOW TARGET',
      isValid: false,
      errorMessage: 'Attend + Miss cannot exceed upcoming classes.',
    }
  }

  const safeHeld = sanitizeNumber(held)
  const safeAttended = sanitizeNumber(attended)

  if (safeHeld + upcoming <= 0) {
    return {
      upcoming,
      attend,
      miss,
      projectedPercentage: 0,
      diff: 0,
      status: 'BELOW TARGET',
      isValid: true,
    }
  }

  const currentDisplayPct = Number(
    calculateAttendance(safeAttended, safeHeld).toFixed(2),
  )
  const projected = calculateAttendance(safeAttended + attend, safeHeld + upcoming)
  const projectedPercentage = Number(projected.toFixed(2))
  const diff = Number((projectedPercentage - currentDisplayPct).toFixed(2))
  const status = deriveStatus(projected, target)

  return {
    upcoming,
    attend,
    miss,
    projectedPercentage,
    diff,
    status,
    isValid: true,
  }
}

export function validateAttendanceInput(
  held: number,
  attended: number,
): { isValid: boolean; error?: string } {
  if (!Number.isFinite(held) || !Number.isFinite(attended)) {
    return { isValid: false, error: 'Please enter valid whole numbers.' }
  }

  if (held < 0 || attended < 0) {
    return { isValid: false, error: 'Classes cannot be negative.' }
  }

  if (attended > held) {
    return {
      isValid: false,
      error: 'Attended classes cannot be greater than classes held.',
    }
  }

  return { isValid: true }
}
