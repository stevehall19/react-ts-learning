
type CounterProps = {
    label: string
    count: number                 // the parent now owns this value
    onIncrement: () => void       // a function with no arguments that returns nothing
    onReset: () => void
}

function Counter({ label, count, onIncrement, onReset }: CounterProps) {
    return <div>
        <button
            type="button"
            className="counter"
            onClick={() => onReset()}
        >
            Reset
        </button>
        <button
            type="button"
            className="counter"
            onClick={() => onIncrement()}
        >
        {label} is {count}
        </button>
    </div>

}

export default Counter