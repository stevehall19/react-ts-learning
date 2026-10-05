import type { CounterItem } from './types'

export type Counters = {
  items: CounterItem[]
  total: number
  status: 'loading' | 'ready' | 'error'
  error: string | null
  increment: (id: string) => Promise<void>
  reset: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  add: (label: string, step: number, start?: number) => Promise<void>
}
