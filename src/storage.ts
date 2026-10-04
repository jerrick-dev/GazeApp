import type { GazeLog, GazeLogs } from './types'

const STORAGE_KEY = 'gaze.logs.v1'

export function loadLogs(): GazeLogs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as GazeLogs
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveLogs(logs: GazeLogs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function upsertLog(
  logs: GazeLogs,
  date: string,
  used: boolean,
  note: string,
): GazeLogs {
  const next: GazeLogs = {
    ...logs,
    [date]: {
      date,
      used,
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    },
  }
  saveLogs(next)
  return next
}

export function getLog(logs: GazeLogs, date: string): GazeLog | undefined {
  return logs[date]
}
