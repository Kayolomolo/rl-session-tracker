import { createContext, useContext } from 'react'
import type { MyData } from './useMyData'

export type Ready = MyData & { user: NonNullable<MyData['user']>; profile: NonNullable<MyData['profile']>; actions: NonNullable<MyData['actions']> }
export const DataContext = createContext<Ready | null>(null)

export function useData(): Ready {
  const d = useContext(DataContext)
  if (!d) throw new Error('useData buiten DataContext')
  return d
}
