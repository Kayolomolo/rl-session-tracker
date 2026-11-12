import { IconCloudOff, IconRefresh } from '@tabler/icons-react'

export function OfflineBadge({ online, pending, dropped = 0 }: { online: boolean; pending: number; dropped?: number }) {
  if (online && pending === 0 && dropped === 0) return null
  if (online && pending === 0) {
    return (
      <div role="alert" className="fixed left-1/2 top-[calc(8px+env(safe-area-inset-top))] z-30 -translate-x-1/2 whitespace-nowrap rounded-lg border border-orange bg-[#2a1a0a] px-3 py-1 text-xs text-orange-text shadow-lg">
        {dropped} {dropped === 1 ? 'wijziging kon' : 'wijzigingen konden'} niet worden opgeslagen
      </div>
    )
  }
  return (
    <div role="status" className="fixed left-1/2 top-[calc(8px+env(safe-area-inset-top))] z-30 -translate-x-1/2 -skew-x-12 whitespace-nowrap rounded-lg border border-orange bg-[#2a1a0a] px-3 py-1 text-xs text-orange-text shadow-lg">
      <span className="flex skew-x-12 items-center gap-1.5">
        {online ? <IconRefresh size={14} aria-hidden="true" /> : <IconCloudOff size={14} aria-hidden="true" />}
        {online ? `Synchroniseren… (${pending})` : `Offline — wordt gesynchroniseerd${pending ? ` (${pending})` : ''}`}
      </span>
    </div>
  )
}
