import type { GazeLogs } from '../types'
import { WEEKDAYS, buildMonthGrid, formatMonthTitle } from '../dates'

type MonthCalendarProps = {
  month: Date
  todayKey: string
  selectedKey: string
  logs: GazeLogs
  onSelectDate: (key: string) => void
  onShiftMonth: (amount: number) => void
}

export function MonthCalendar({
  month,
  todayKey,
  selectedKey,
  logs,
  onSelectDate,
  onShiftMonth,
}: MonthCalendarProps) {
  const cells = buildMonthGrid(month, todayKey)

  return (
    <section className="calendar-card" aria-label="Monthly gaze calendar">
      <header className="calendar-header">
        <button type="button" className="nav-btn" onClick={() => onShiftMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <h2>{formatMonthTitle(month)}</h2>
        <button type="button" className="nav-btn" onClick={() => onShiftMonth(1)} aria-label="Next month">
          ›
        </button>
      </header>

      <div className="weekday-row" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="month-grid">
        {cells.map((cell) => {
          const log = logs[cell.key]
          const classes = [
            'day-cell',
            cell.inMonth ? '' : 'is-outside',
            cell.isToday ? 'is-today' : '',
            cell.key === selectedKey ? 'is-selected' : '',
            log?.used ? 'has-gaze' : '',
            log && !log.used ? 'has-note' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={cell.key}
              type="button"
              className={classes}
              onClick={() => onSelectDate(cell.key)}
            >
              <span>{cell.date.getDate()}</span>
              {log ? <i className="day-dot" /> : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
