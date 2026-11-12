import { expect, test } from 'vitest'
import { barLayout } from './geometry'

test('schuine staven blijven binnen de grafiek, ook bij veel weken', () => {
  for (const n of [1, 4, 12, 30, 80, 200]) {
    const { slot, bw, lean } = barLayout(n, 300, 84)
    const lastRightTop = (n - 1) * slot + (slot + bw) / 2 + lean
    expect(lastRightTop).toBeLessThanOrEqual(300)
    expect(bw).toBeLessThanOrEqual(slot)
  }
})
