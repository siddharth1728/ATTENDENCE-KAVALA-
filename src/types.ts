export type AttendanceStatus = 'SAFE' | 'BELOW TARGET'

export interface CategoryAttendance {
  category: 'REGULAR' | 'ECE'
  name: string
  held: number
  attended: number
  absent: number
  percentage: number
  status: AttendanceStatus
  safeAbsences: number
  recoveryClasses: number
  target: number
  boundarySafe: {
    absences: number
    percentage: number
  }
  boundaryFail: {
    absences: number
    percentage: number
  }
  nextAttendPercentage: number
  nextMissPercentage: number
  hasRecordedData: boolean
}

export type ScenarioPreset = '1' | '3' | '5' | '10' | 'custom'

export interface ScenarioOutcome {
  classes: number
  attendAllPercentage: number
  missAllPercentage: number
  attendAllDiff: number
  missAllDiff: number
}

export interface CustomWhatIf {
  upcoming: number
  attend: number
  miss: number
  projectedPercentage: number
  diff: number
  status: AttendanceStatus
  isValid: boolean
  errorMessage?: string
}

export interface AttendanceInputState {
  regularHeld: number
  regularAttended: number
  eceHeld: number
  eceAttended: number
}

export interface SavedAttendanceState {
  inputs: AttendanceInputState
  lastUpdated: string
}
