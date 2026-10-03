import { createContext, use } from 'react'
import { useCounters } from './useCounters.ts'

const CountersContext = createContext<ReturnType<typeof useCounters> | null>(
  null,
)

export function CountersProvider({ children }: { children: React.ReactNode }) {
  const counters = useCounters()
  return <CountersContext value={counters}>{children}</CountersContext>
}

export function useCountersContext() {
  const ctx = use(CountersContext)
  if (!ctx)
    throw new Error('useCountersContext must be used inside CountersProvider')
  return ctx
}
