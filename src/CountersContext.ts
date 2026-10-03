import type { useCounters } from './useCounters'
import { createContext, use } from 'react'

export const CountersContext = createContext<ReturnType<
  typeof useCounters
> | null>(null)

export function useCountersContext() {
  const ctx = use(CountersContext)
  if (!ctx)
    throw new Error('useCountersContext must be used inside CountersProvider')
  return ctx
}
