
export type Preset = {
    label: string
    step: number
    start: number
}

export function isPresets(value: unknown): value is Preset[] {
    return (Array.isArray(value) && value.every(isPreset));
}

export function isPreset(value: unknown): value is Preset {
    return typeof value === 'object'
        && value !== null
        && 'label' in value && typeof value.label === 'string'
        && 'start' in value && typeof value.start === 'number'
        && 'step' in value && typeof value.step === 'number'
        && Number.isInteger(value.step)
        && value.step > 0;
}

export type CounterItem = {
    id: string
    label: string
    count: number
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
        && 'step' in value && typeof value.step === 'number'
        && Number.isInteger(value.step)
        && value.step > 0;
}
