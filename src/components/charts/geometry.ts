const LEAN = Math.tan((8 * Math.PI) / 180)

/** Breedte per week en per staaf, met ruimte rechts voor de schuine top (skewX −8°). */
export function barLayout(n: number, width: number, bottom: number): { slot: number; bw: number; lean: number; tan: number } {
  const lean = (bottom - 6) * LEAN
  const slot = (width - lean) / Math.max(1, n)
  const bw = Math.min(28, Math.max(Math.min(4, slot * 0.9), slot * 0.6))
  return { slot, bw, lean, tan: LEAN }
}
