export const WEEKDAYS = ['M', 'T', 'W', 'TH', 'F', 'SAT', 'SUN'] as const

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMonthTitle(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export type CalendarCell = {
  date: Date
  key: string
  inMonth: boolean
  isToday: boolean
}

export function buildMonthGrid(month: Date, todayKey: string): CalendarCell[] {
  const first = startOfMonth(month)
  const offset = mondayIndex(first)
  const start = new Date(first)
  start.setDate(first.getDate() - offset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = toDateKey(date)
    return {
      date,
      key,
      inMonth: date.getMonth() === month.getMonth(),
      isToday: key === todayKey,
    }
  })
}

export function currentWeekKeys(today: Date): string[] {
  const start = new Date(today)
  start.setDate(today.getDate() - mondayIndex(today))
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return toDateKey(date)
  })
}
