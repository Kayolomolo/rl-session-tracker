import { expect, test } from 'vitest'
import { fetchAllRows } from './paging'

test('fetchAllRows haalt alle pagina\'s op, ook boven 1000 rijen', async () => {
  const all = Array.from({ length: 2500 }, (_, i) => ({ id: i }))
  const calls: [number, number][] = []
  const rows = await fetchAllRows(async (from, to) => { calls.push([from, to]); return { data: all.slice(from, to + 1), error: null } })
  expect(rows).toHaveLength(2500)
  expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
})

test('fetchAllRows stopt bij precies 1000 rijen na een lege pagina', async () => {
  const all = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
  const rows = await fetchAllRows(async (from, to) => ({ data: all.slice(from, to + 1), error: null }))
  expect(rows).toHaveLength(1000)
})

test('fetchAllRows gooit een fout door', async () => {
  await expect(fetchAllRows(async () => ({ data: null, error: { message: 'kapot' } }))).rejects.toThrow('kapot')
})
