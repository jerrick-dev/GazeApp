import { useEffect, useState } from 'react'
import { formatLongDate, parseDateKey } from '../dates'
import type { GazeLog } from '../types'

type JournalModalProps = {
  dateKey: string
  existing?: GazeLog
  onClose: () => void
  onSave: (used: boolean, note: string) => void
}

export function JournalModal({ dateKey, existing, onClose, onSave }: JournalModalProps) {
  const [used, setUsed] = useState(existing?.used ?? true)
  const [note, setNote] = useState(existing?.note ?? '')
  const date = parseDateKey(dateKey)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <form
        className="journal-card"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          onSave(used, note)
        }}
      >
        <p className="journal-kicker">A quiet record</p>
        <h2>{formatLongDate(date)}</h2>
        <p className="journal-copy">
          Log whether you used contact lenses today, and anything you noticed while meeting another gaze.
        </p>

        <label className={`toggle ${used ? 'is-on' : ''}`}>
          <input type="checkbox" checked={used} onChange={(event) => setUsed(event.target.checked)} />
          <span className="toggle-ui" aria-hidden="true" />
          <span>{used ? 'I used eye contact today' : 'No eye contact logged'}</span>
        </label>

        <label className="note-label" htmlFor="journal-note">
          What did you see?
        </label>
        <textarea
          id="journal-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="A barista’s smile. The greeting of a soft morning light. A reunion with an old friend."
          rows={6}
        />

        <div className="journal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="save-btn">
            Save entry
          </button>
        </div>
      </form>
    </div>
  )
}
