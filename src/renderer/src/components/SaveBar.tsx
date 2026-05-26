// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import '../styles/components/SaveBar.css'

export default function SaveBar(): React.JSX.Element | null {
  const pendingCount = useGameStore((s) => s.pendingCount)
  const saveChanges = useGameStore((s) => s.saveChanges)
  const discardChanges = useGameStore((s) => s.discardChanges)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (pendingCount === 0 && !message) return null

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setMessage(null)
    try {
      const result = await saveChanges()
      if (result.success) {
        setMessage(`Saved ${result.savedFiles.length} file(s) successfully`)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage(`Errors: ${result.errors.map((e) => e.error).join(', ')}`)
      }
    } catch (err) {
      setMessage(`Save failed: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="save-bar">
      {pendingCount > 0 && (
        <>
          <span className="save-bar-count">
            {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending
          </span>
          <button className="btn btn-primary btn-small" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-secondary btn-small" onClick={discardChanges} disabled={saving}>
            Discard
          </button>
        </>
      )}
      {message && <span className="save-bar-message">{message}</span>}
    </div>
  )
}
