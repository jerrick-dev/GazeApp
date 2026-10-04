import { useMemo, useState } from 'react'
import { EyeStage } from './components/EyeStage'
import { JournalModal } from './components/JournalModal'
import { MonthCalendar } from './components/MonthCalendar'
import { WeekStrip } from './components/WeekStrip'
import { addMonths, startOfMonth, toDateKey } from './dates'
import { loadLogs, upsertLog } from './storage'
import type { GazeLogs } from './types'
import './App.css'

function App() {
  const today = useMemo(() => new Date(), [])
  const todayKey = toDateKey(today)
  const [logs, setLogs] = useState<GazeLogs>(() => loadLogs())
  const [month, setMonth] = useState(() => startOfMonth(today))
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [journalOpen, setJournalOpen] = useState(false)
  const [glowing, setGlowing] = useState(false)

  const loggedToday = Boolean(logs[todayKey]?.used)
  const usedThisMonth = Object.values(logs).filter((log) => {
    return log.used && log.date.startsWith(
      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
    )
  }).length

  const openJournal = (key: string) => {
    setSelectedKey(key)
    setJournalOpen(true)
    if (key === todayKey) {
      setGlowing(true)
    }
  }

  return (
    <div className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="orb orb-three" />

      <header className="top-bar">
        <div>
          <p className="kicker">Daily presence</p>
          <h1>Gaze</h1>
        </div>
        <p className="month-count">{usedThisMonth} days of contact this month</p>
      </header>

      <main className="layout">
        <section className="hero">
          <EyeStage
            glowing={glowing}
            loggedToday={loggedToday}
            onSelect={() => openJournal(todayKey)}
          />
          <p className="hint">Click to log today’s gaze.</p>
          <WeekStrip
            today={today}
            todayKey={todayKey}
            selectedKey={selectedKey}
            logs={logs}
            onSelectDate={openJournal}
          />
        </section>

        <MonthCalendar
          month={month}
          todayKey={todayKey}
          selectedKey={selectedKey}
          logs={logs}
          onSelectDate={openJournal}
          onShiftMonth={(amount) => setMonth((current) => addMonths(current, amount))}
        />
      </main>

      {journalOpen ? (
        <JournalModal
          dateKey={selectedKey}
          existing={logs[selectedKey]}
          onClose={() => {
            setJournalOpen(false)
            setGlowing(false)
          }}
          onSave={(used, note) => {
            setLogs((current) => upsertLog(current, selectedKey, used, note))
            setJournalOpen(false)
            setGlowing(selectedKey === todayKey && used)
            window.setTimeout(() => setGlowing(false), 1800)
          }}
        />
      ) : null}
    </div>
  )
}

export default App
