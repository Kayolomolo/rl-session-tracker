export function ChartTip({ text }: { text: string }) {
  return <p role="status" className="mt-2 text-center text-xs text-ink"><span className="inline-block -skew-x-12 rounded bg-rl-nav px-2 py-1"><span className="inline-block skew-x-12">{text}</span></span></p>
}
