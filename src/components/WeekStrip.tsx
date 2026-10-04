import { WEEKDAYS, currentWeekKeys, parseDateKey } from '../dates'
import type { GazeLogs } from '../types'

type WeekStripProps = {
  today: Date
  todayKey: string
  selectedKey: string
  logs: GazeLogs
  onSelectDate: (key: string) => void
}

export function WeekStrip({ today, todayKey, selectedKey, logs, onSelectDate }: WeekStripProps) {
  const keys = currentWeekKeys(today)

  return (
    <div className="week-strip" aria-label="This week">
      {keys.map((key, index) => {
        const date = parseDateKey(key)
        const log = logs[key]
        const isToday = key === todayKey
        const classes = [
          'week-day',
          isToday ? 'is-today' : '',
          key === selectedKey ? 'is-selected' : '',
          log?.used ? 'has-gaze' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button key={key} type="button" className={classes} onClick={() => onSelectDate(key)}>
            <span className="week-label">{WEEKDAYS[index]}</span>
            <span className="week-number">{date.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}
