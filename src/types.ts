
export type CounterItem = {
    id: string
    label: string
    count: number                  // the parent now owns this value
    step: number
    start: number
}

export function isCounterItems(value: unknown): value is CounterItem[] {
    return (Array.isArray(value) && value.every(isCounterItem));
}

export function isCounterItem(value: unknown): value is CounterItem {
    return typeof value === 'object'
        && value !== null
        && 'id' in value && typeof value.id === 'string'
        && 'label' in value && typeof value.label === 'string'
        && 'count' in value && typeof value.count === 'number'
        && 'start' in value && typeof value.start === 'number'
        && 'step' in value && typeof value.step === 'number';
}

export function isString(value: unknown): value is string {
    return typeof value === 'string'
}