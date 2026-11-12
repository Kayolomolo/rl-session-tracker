export function WinLossBar({ wins, losses, className = '' }: { wins: number; losses: number; className?: string }) {
  if (wins + losses === 0) return <div className={`h-1.5 -skew-x-[20deg] bg-rl-line ${className}`} />
  return (
    <div className={`flex h-1.5 gap-[3px] ${className}`} role="img" aria-label={`${wins} gewonnen, ${losses} verloren`}>
      {wins > 0 && <span className="-skew-x-[20deg] bg-blue" style={{ flex: wins }} />}
      {losses > 0 && <span className="-skew-x-[20deg] bg-orange" style={{ flex: losses }} />}
    </div>
  )
}
