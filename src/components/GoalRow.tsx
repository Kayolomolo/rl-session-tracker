import { IconCircleCheck } from '@tabler/icons-react'
import { goalTitle, type Goal, type GoalProgress } from '../lib/goals'

export function GoalRow({ goal, progress, history, onClick }: { goal: Goal; progress: GoalProgress; history?: boolean[] | null; onClick?: () => void }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-base font-bold uppercase italic leading-tight">{goalTitle(goal.config)}</p>
        {progress.done && <IconCircleCheck size={20} className="shrink-0 text-blue-text" aria-label="Gehaald" />}
      </div>
      <p className={`mt-0.5 text-xs ${progress.done ? 'text-blue-text' : 'text-muted'}`}>{progress.label}</p>
      <div className="mt-2 h-1.5 bg-rl-nav" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.ratio * 100)} aria-label={progress.label}>
        <div className="h-full -skew-x-[20deg] bg-blue transition-[width] duration-700" style={{ width: `${Math.max(progress.ratio > 0 ? 3 : 0, progress.ratio * 100)}%` }} />
      </div>
      {history && (
        <div className="mt-2 flex items-center gap-1.5" aria-label={`Afgelopen 4 weken: ${history.filter(Boolean).length} keer gehaald`}>
          {history.map((hit, i) => <span key={i} className={`h-2 w-2 rounded-full ${hit ? 'bg-blue' : 'bg-rl-line'}`} />)}
          <span className="ml-1 text-[10px] text-muted">vorige 4 weken</span>
        </div>
      )}
    </>
  )
  return onClick
    ? <button type="button" onClick={onClick} className="block w-full py-2.5 text-left">{body}</button>
    : <div className="py-2.5">{body}</div>
}
