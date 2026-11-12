import { useEffect } from 'react'
import { goalProgress } from '../lib/goals'
import { useData } from './dataContext'

/** Zet eenmalig 'gehaald' op rank- en MMR-doelen zodra ze gehaald zijn. */
export function AchievementWatcher() {
  const { goals, sessions, profile, actions } = useData()
  useEffect(() => {
    const now = Date.now()
    for (const g of goals) {
      if (g.archivedAt || g.achievedAt || (g.config.kind !== 'rank' && g.config.kind !== 'mmr')) continue
      if (goalProgress(g, sessions, profile, now).done) actions.markAchieved(g, now)
    }
  }, [goals, sessions, profile, actions])
  return null
}
