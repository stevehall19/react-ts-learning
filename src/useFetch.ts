import { useEffect, useState } from 'react'

export type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T }

export function useFetch<T>(
  url: string,
  isValid: (value: unknown) => value is T,
): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' })

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const response = await fetch(url)
        if (ignore) return

        if (!response.ok) {
          setState({ status: 'error', error: `HTTP ${response.status}` })
        } else {
          const responseData: unknown = await response.json()
          if (ignore) return
          if (isValid(responseData)) {
            setState({ status: 'success', data: responseData })
          } else {
            setState({ status: 'error', error: 'unexpected data from ' + url })
          }
        }
      } catch (e) {
        if (ignore) return
        setState({
          status: 'error',
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
    load()

    return () => {
      ignore = true
    }
  }, [url, isValid])
  return state
}
