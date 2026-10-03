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
      <button type="button" className="counter" onClick={() => onReset()}>
        Reset
      </button>
      <button type="button" className="counter" onClick={() => onIncrement()}>
        {label} is {count}
      </button>
      <button type="button" className="counter" onClick={() => onRemove()}>
        X
      </button>
    </div>
  )
}

export default Counter
