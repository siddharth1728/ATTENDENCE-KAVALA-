export type Status = 'SAFE' | 'WATCH' | 'AT RISK' | 'CRITICAL' | 'NO DATA'

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

  if (safeHeld <= 0) return 0
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

  if (safeHeld <= 0) return 0
  return (safeAttended / (safeHeld + safeFutureClasses)) * 100
}

export function calculateMixedScenario(
  attended: number,
  held: number,
  futureClasses: number,
  futureAttended: number,
): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeFutureClasses = sanitizeNumber(futureClasses)
  const safeFutureAttended = sanitizeNumber(futureAttended)

  if (safeHeld <= 0) return 0
  return ((safeAttended + safeFutureAttended) / (safeHeld + safeFutureClasses)) * 100
}

export function calculateClassesNeeded(
  attended: number,
  held: number,
  target: number,
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
  target: number,
): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeTarget = sanitizeNumber(target)

  if (safeHeld <= 0 || safeTarget <= 0) return 0

  const value = (100 * safeAttended - safeTarget * safeHeld) / safeTarget
  return value <= 0 ? 0 : Math.floor(value)
}

export function calculateMaximumPossible(
  attended: number,
  held: number,
  remainingClasses: number,
): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeRemaining = sanitizeNumber(remainingClasses)

  if (safeHeld <= 0) return 0
  return ((safeAttended + safeRemaining) / (safeHeld + safeRemaining)) * 100
}

export function calculateMinimumPossible(
  attended: number,
  held: number,
  remainingClasses: number,
): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeRemaining = sanitizeNumber(remainingClasses)

  if (safeHeld <= 0 && safeRemaining <= 0) return 0
  return (safeAttended / (safeHeld + safeRemaining)) * 100
}

export function calculateExpectedFinal(
  attended: number,
  held: number,
  remainingClasses: number,
  expectedAttendanceRate: number,
): number {
  const safeAttended = sanitizeNumber(attended)
  const safeHeld = sanitizeNumber(held)
  const safeRemaining = sanitizeNumber(remainingClasses)
  const rate = sanitizeNumber(expectedAttendanceRate)

  if (safeHeld <= 0 && safeRemaining <= 0) return 0

  const expectedFutureAttended = safeRemaining * (rate / 100)
  return ((safeAttended + expectedFutureAttended) / (safeHeld + safeRemaining)) * 100
}

export function calculateRecoveryClasses(
  attended: number,
  held: number,
  target: number,
): number {
  const needed = calculateClassesNeeded(attended, held, target)
  return needed === null ? 0 : needed
}

export function calculateTargetReachability(
  attended: number,
  held: number,
  target: number,
  remainingClasses: number,
): {
  maxPossible: number
  minRemainingToAttend: number | null
  reachable: boolean
} {
  const safeTarget = sanitizeNumber(target)
  const safeHeld = sanitizeNumber(held)
  const safeRemaining = sanitizeNumber(remainingClasses)
  const safeAttended = sanitizeNumber(attended)

  const maxPossible = calculateMaximumPossible(safeAttended, safeHeld, safeRemaining)
  const reachable = maxPossible >= safeTarget

  let minRemainingToAttend: number | null = null
  if (reachable && safeTarget > 0 && safeTarget < 100) {
    const needed = Math.ceil((safeTarget * (safeHeld + safeRemaining) - 100 * safeAttended) / 100)
    minRemainingToAttend = Math.max(0, needed)
  }

  return { maxPossible, minRemainingToAttend, reachable }
}

export function calculateDailyImpact(attended: number, held: number) {
  const current = calculateAttendance(attended, held)
  const oneAttendanceImpact = calculateAttendance(attended + 1, held + 1) - current
  const oneAbsenceImpact = calculateAttendance(attended, held + 1) - current
  const ratio = Math.abs(oneAbsenceImpact) / Math.max(Math.abs(oneAttendanceImpact), 0.0001)

  return {
    current,
    oneAttendanceImpact,
    oneAbsenceImpact,
    impactRatio: Number.isFinite(ratio) ? ratio : 0,
  }
}

export function calculateWeeklyImpact(
  attended: number,
  held: number,
  weeklyClasses: number,
  expectedRate: number,
) {
  const best = calculateExpectedFinal(attended, held, weeklyClasses, 100)
  const expected = calculateExpectedFinal(attended, held, weeklyClasses, expectedRate)
  const worst = calculateExpectedFinal(attended, held, weeklyClasses, 0)

  return { best, expected, worst }
}

export function calculateSemesterProjection(
  attended: number,
  held: number,
  remainingClasses: number,
  expectedRate: number,
) {
  const current = calculateAttendance(attended, held)
  const best = calculateExpectedFinal(attended, held, remainingClasses, 100)
  const expected = calculateExpectedFinal(attended, held, remainingClasses, expectedRate)
  const worst = calculateExpectedFinal(attended, held, remainingClasses, 0)

  return { current, best, expected, worst }
}

export function calculateAttendanceImpactRatio(attended: number, held: number): number {
  return calculateDailyImpact(attended, held).impactRatio
}

export function getAttendanceStatus(attendance: number, target: number): Status {
  if (!Number.isFinite(attendance)) return 'NO DATA'
  if (attendance <= 0 && Number.isFinite(target) && target > 0) return 'CRITICAL'

  if (attendance >= target + 10) return 'SAFE'
  if (attendance >= target - 5) return 'WATCH'
  if (attendance >= 60) return 'AT RISK'
  return 'CRITICAL'
}
