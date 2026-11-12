import { expect, test } from 'vitest'
import { activityOptions, addCustom, DEFAULT_ACTIVITIES } from './activities'

test('standaardactiviteiten volgens de spec', () => {
  expect(DEFAULT_ACTIVITIES.warmup).toEqual(['Freeplay', 'Shooting', 'Dribbling', 'Aerials', 'Recoveries'])
  expect(DEFAULT_ACTIVITIES.training).toEqual(['Mechanical training', 'Workshop maps', 'Rings maps', 'Dribble maps', 'Custom training packs', 'Shooting practice'])
})
test('activityOptions voegt eigen activiteiten achteraan toe', () => {
  expect(activityOptions('warmup', ['Wall reads'])).toEqual([...DEFAULT_ACTIVITIES.warmup, 'Wall reads'])
})
test('addCustom trimt en weigert leeg of dubbel', () => {
  expect(addCustom(['Wall reads'], '  wall READS ')).toEqual(['Wall reads'])
  expect(addCustom([], '   ')).toEqual([])
  expect(addCustom([], ' Air dribble ')).toEqual(['Air dribble'])
  expect(addCustom([], 'freeplay')).toEqual([])
})
