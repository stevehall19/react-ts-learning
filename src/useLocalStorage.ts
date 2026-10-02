import { useEffect, useState } from 'react'

export function useLocalStorage<T>(
    key: string,
    fallback: T,
    isValid: (value: unknown) => value is T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
    // 1. useState with the function form, as before: read localStorage[key],
    //    JSON.parse it in try/catch, and use isValid to decide between parsed data and fallback
    const [value, setValue] = useState<T>( () => {
        const stored = localStorage.getItem(key)
        if (stored === null) return fallback;
        try {
            const data: unknown = JSON.parse(stored)
            return isValid(data) ? data : fallback
        } catch {
            return fallback
        }
    })
    // 2. useEffect that saves the value whenever it changes. What belongs in the dependency array?
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value))
    }, [key, value])
    // 3. return the [value, setValue] tuple
    return [value, setValue]
}