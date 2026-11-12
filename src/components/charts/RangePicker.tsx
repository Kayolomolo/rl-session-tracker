import { SkewButton } from '../SkewButton'

interface Props<T extends string | number> { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }

export function RangePicker<T extends string | number>({ value, options, onChange }: Props<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <SkewButton key={String(o.value)} variant={o.value === value ? 'light' : 'ghost'} onClick={() => onChange(o.value)} className="whitespace-nowrap !px-3 !py-1 text-sm">{o.label}</SkewButton>
      ))}
    </div>
  )
}
