import { useCounters } from './useCounters'
import { CountersContext } from './CountersContext'
import { useRemoteCounters } from './useRemoteCounters'

const useCountersImpl =
  import.meta.env.VITE_COUNTERS_API === 'true' ? useRemoteCounters : useCounters

export function CountersProvider({ children }: { children: React.ReactNode }) {
  const counters = useCountersImpl()
  return <CountersContext value={counters}>{children}</CountersContext>
}
