import {useState} from "react";

type CounterProps = {
    label: string
    step: number
    start?: number
}

function Counter({ label, step, start = 0}: CounterProps) {
    const [count, setCount] = useState(start)
    return <div>
        <button
            type="button"
            className="counter"
            onClick={() => setCount(start)}
        >
            Reset
        </button>
        <button
            type="button"
            className="counter"
            onClick={() => setCount((count) => count + step)}
        >
        {label} is {count}
        </button>
    </div>

}

export default Counter