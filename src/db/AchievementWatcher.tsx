import { useEffect, useRef } from 'react'
import { goalsToMark } from '../lib/goals'
import { useData } from './dataContext'

/** Zet eenmalig 'gehaald' op rank- en MMR-doelen zodra ze gehaald zijn (per doel maximaal één keer per app-sessie). */
export function AchievementWatcher() {
  const { goals, sessions, profile, actions } = useData()
  const marked = useRef(new Set<string>())
  useEffect(() => {
    const now = Date.now()
    for (const g of goalsToMark(goals, sessions, profile, now, marked.current)) {
      marked.current.add(g.id)
      actions.markAchieved(g, now)
    }
  }, [goals, sessions, profile, actions])
  return null
}
