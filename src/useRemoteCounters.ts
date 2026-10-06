import { useEffect, useState } from 'react'
import type { Counters } from './counters'
import type { CounterItem } from './types'
import {
  listCounters,
  createCounter,
  incrementCounter,
  resetCounter,
  removeCounter,
} from './countersApi'

export function useRemoteCounters(): Counters {
  const [items, setItems] = useState<CounterItem[]>([])
  const [status, setStatus] = useState<Counters['status']>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const counters = await listCounters()
        if (ignore) return
        setItems(counters)
        setStatus('ready')
      } catch (e) {
        if (ignore) return
        setStatus('error')
        setError(e instanceof Error ? e.message : String(e))
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [])

  async function increment(id: string) {
    const updated = await incrementCounter(id)
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
  }

  async function reset(id: string) {
    const updated = await resetCounter(id)
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
  }

  async function remove(id: string) {
    await removeCounter(id)
    setItems((prev) => prev.filter((counter) => counter.id !== id))
  }

  async function add(label: string, step: number, start?: number) {
    const createdItem = await createCounter(label, step, start)
    setItems((prev) => [...prev, createdItem])
  }

  const total = items.reduce((sum, item) => sum + item.count, 0)
  return { items, total, status, error, increment, reset, remove, add }
}
