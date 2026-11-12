import { useState } from 'react'

/** Kleine voorkeur (bijv. gekozen periode) onthouden in localStorage; werkt ook als opslag geblokkeerd is. */
export function useStoredState<T>(key: string, initial: T, valid: (v: unknown) => v is T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      const parsed: unknown = raw === null ? undefined : JSON.parse(raw)
      return valid(parsed) ? parsed : initial
    } catch { return initial }
  })
  const set = (v: T) => {
    setValue(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* geen opslag: alleen deze sessie */ }
  }
  return [value, set]
}
