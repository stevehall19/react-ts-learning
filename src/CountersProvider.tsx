import { useCounters } from './useCounters'
import { CountersContext } from './CountersContext'
import { useRemoteCounters } from './useRemoteCounters'
import { apiEnabled } from './common'

const useCountersImpl = apiEnabled ? useRemoteCounters : useCounters

export function CountersProvider({ children }: { children: React.ReactNode }) {
  const counters = useCountersImpl()
  return <CountersContext value={counters}>{children}</CountersContext>
}
