import { IconExternalLink } from '@tabler/icons-react'
import { trackerUrl } from '../lib/mmr'
import type { TrackerProfile } from '../lib/types'

/** Knop die je profiel op rocketleague.tracker.network opent; niets als er geen tracker-profiel is. */
export function TrackerLink({ tracker, className = '' }: { tracker?: TrackerProfile | null; className?: string }) {
  const url = trackerUrl(tracker)
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`inline-flex -skew-x-12 items-center justify-center rounded-lg border border-[#3d8bff]/70 bg-[#0f2c5c]/80 px-4 py-2 font-display font-bold uppercase italic tracking-wide text-white shadow-[0_0_14px_rgb(30_139_255/.4)] active:scale-[0.97] ${className}`}>
      <span className="flex skew-x-12 items-center gap-2">Bekijk op tracker <IconExternalLink size={18} aria-hidden="true" /></span>
    </a>
  )
}
