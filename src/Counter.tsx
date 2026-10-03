import { Button } from './Button'

type CounterProps = {
  label: string
  count: number // the parent now owns this value
  onIncrement: () => void // a function with no arguments that returns nothing
  onReset: () => void
  onRemove: () => void
}

function Counter({
  label,
  count,
  onIncrement,
  onReset,
  onRemove,
}: CounterProps) {
  return (
    <div>
      <Button type="button" onClick={() => onReset()}>
        Reset
      </Button>
      <Button type="button" onClick={() => onIncrement()}>
        {label} is {count}
      </Button>
      <Button
        variant="danger"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
      >
        ✕
      </Button>
    </div>
  )
}

export default Counter
