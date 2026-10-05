import { type CounterItem, isCounterItems } from './types'
import { useLocalStorage } from './useLocalStorage'
import type { Counters } from './counters'

const initialItems: CounterItem[] = [
  { id: crypto.randomUUID(), label: 'Ones', step: 1, start: 0, count: 0 },
  { id: crypto.randomUUID(), label: 'Threes', step: 3, start: 0, count: 0 },
  { id: crypto.randomUUID(), label: 'Fives', step: 5, start: 0, count: 0 },
  { id: crypto.randomUUID(), label: 'Tens', step: 10, start: 100, count: 100 },
]

export function useCounters(): Counters {
  const [items, setItems] = useLocalStorage(
    'counters',
    initialItems,
    isCounterItems,
  )

  async function increment(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, count: item.count + item.step } : item,
      ),
    )
  }

  async function reset(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, count: item.start } : item,
      ),
    )
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function add(label: string, step: number, start = 0) {
    const newItem: CounterItem = {
      id: crypto.randomUUID(),
      label,
      step,
      start,
      count: start,
    }
    setItems((prev) => [...prev, newItem])
  }

  const total = items.reduce((sum, item) => sum + item.count, 0)

  return {
    items,
    total,
    status: 'ready',
    error: null,
    increment,
    reset,
    remove,
    add,
  }
}
