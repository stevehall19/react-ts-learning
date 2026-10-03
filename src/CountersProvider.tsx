import { useCounters } from './useCounters'
import { CountersContext } from './CountersContext'

export function CountersProvider({ children }: { children: React.ReactNode }) {
  const counters = useCounters()
  return <CountersContext value={counters}>{children}</CountersContext>
}
