import type { AttendanceInputState, SavedAttendanceState } from '../types'
import { initialAttendanceInputs } from '../data/initialData'

const STORAGE_KEY = 'attend_aggregate_state_v1'

const memoryStore: Record<string, string> = {}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  return {
    getItem: (key: string) => memoryStore[key] ?? null,
    setItem: (key: string, value: string) => {
      memoryStore[key] = value
    },
    removeItem: (key: string) => {
      delete memoryStore[key]
    },
  }
}

export function loadStoredAttendanceState(): SavedAttendanceState | null {
  try {
    const storage = getStorage()
    const serialized = storage.getItem(STORAGE_KEY)
    if (!serialized) return null

    const parsed = JSON.parse(serialized) as SavedAttendanceState
    if (
      parsed &&
      parsed.inputs &&
      typeof parsed.inputs.regularHeld === 'number' &&
      typeof parsed.inputs.regularAttended === 'number' &&
      typeof parsed.inputs.eceHeld === 'number' &&
      typeof parsed.inputs.eceAttended === 'number'
    ) {
      return parsed
    }
    return null
  } catch (err) {
    console.warn('Could not read saved attendance from storage:', err)
    return null
  }
}

export function saveStoredAttendanceState(inputs: AttendanceInputState): boolean {
  try {
    const storage = getStorage()
    const state: SavedAttendanceState = {
      inputs,
      lastUpdated: new Date().toISOString(),
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (err) {
    console.warn('Could not save attendance to storage:', err)
    return false
  }
}

export function clearStoredAttendanceState(): boolean {
  try {
    const storage = getStorage()
    storage.removeItem(STORAGE_KEY)
    return true
  } catch (err) {
    console.warn('Could not clear saved attendance from storage:', err)
    return false
  }
}

export { initialAttendanceInputs }
