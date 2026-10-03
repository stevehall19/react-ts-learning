import { Link, useNavigate, useParams } from 'react-router'
import { useCountersContext } from '../CountersContext'
import { Button } from '../Button'

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
  const navigate = useNavigate()
  const { id } = useParams()
  const { items, increment, reset, remove } = useCountersContext()
  const item = items.find((i) => i.id === id)

  if (!item) {
    return <CounterNotFound />
  }

  const handleDelete = () => {
    remove(item.id)
    navigate('/')
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold">{item.label}</h1>
        <p className="text-5xl font-bold">{item.count}</p>
      </header>
      <section className="flex gap-2">
        <Button variant="primary" onClick={() => increment(item.id)}>
          +{item.step}
        </Button>
        <Button onClick={() => reset(item.id)}>Reset</Button>
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
