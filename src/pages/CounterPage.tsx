import { Link, useNavigate, useParams } from 'react-router'
import { useCountersContext } from '../CountersContext'
import { Button } from '../Button'
import { useState } from 'react'

function CounterNotFound() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold">Counter not found</h1>
        <Link to="/">Home</Link>
      </header>
    </main>
  )
}

export default function CounterPage() {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { id } = useParams()
  const { items, increment, reset, remove } = useCountersContext()
  const item = items.find((i) => i.id === id)

  async function run(action: () => Promise<void>) {
    try {
      await action()
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  if (!item) {
    return <CounterNotFound />
  }

  const handleDelete = () =>
    run(async () => {
      await remove(item.id)
      navigate('/')
    })

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold">{item.label}</h1>
        <p className="text-5xl font-bold">{item.count}</p>
        {error && (
          <p role="alert" className="text-red-600">
            An error occurred: {error}
          </p>
        )}
      </header>
      <section className="flex gap-2">
        <Button variant="primary" onClick={() => run(() => increment(item.id))}>
          +{item.step}
        </Button>
        <Button onClick={() => run(() => reset(item.id))}>Reset</Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </section>
      <section>
        <Link to="/">Home</Link>
      </section>
    </main>
  )
}
