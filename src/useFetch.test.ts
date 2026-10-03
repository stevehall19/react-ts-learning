import {describe, expect, test, vi} from 'vitest'
import {renderHook, waitFor} from "@testing-library/react";
import {useFetch} from "./useFetch";
import {isPresets} from "./types";



describe('useFetch', () => {

    test('loads and validates data', async () => {

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify([{ label: 'Sevens', step: 7, start: 0 }]), { status: 200 })
        )

        const { result } = renderHook(() => useFetch('/presets.json', isPresets))

        expect(fetchSpy).toHaveBeenCalledWith('/presets.json')

        expect(result.current.status).toBe('loading')            // straight away

        await waitFor(() => expect(result.current.status).toBe('success'))   // retried until it passes

        expect(result.current).toEqual({ status: 'success', data: [{ label: 'Sevens', step: 7, start: 0 }] })
    })

    test('verify http error', async () => {


        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('Not found', { status: 404 })
        )
        const { result } = renderHook(() => useFetch('/presets.json', isPresets))

        expect(fetchSpy).toHaveBeenCalledWith('/presets.json')

        expect(result.current.status).toBe('loading')            // straight away

        await waitFor(() => expect(result.current.status).toBe('error'))   // retried until it passes

        expect(result.current).toEqual({ status: 'error', error: 'HTTP 404' })
    })

    test('verify bad data', async () => {

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify([{ label: 'Sevens', step: '7', start: 0 }]), { status: 200 }))

        const { result } = renderHook(() => useFetch('/presets.json', isPresets))

        expect(fetchSpy).toHaveBeenCalledWith('/presets.json')

        expect(result.current.status).toBe('loading')            // straight away

        await waitFor(() => expect(result.current.status).toBe('error'))   // retried until it passes

        expect(result.current).toEqual({ status: "error", error: "unexpected data from /presets.json"})
    })

    test('verify network error', async () => {


        const fetchSpy = vi.spyOn(globalThis, 'fetch')
            .mockRejectedValue(new TypeError('Failed to fetch'))



        const { result } = renderHook(() => useFetch('/presets.json', isPresets))

        expect(fetchSpy).toHaveBeenCalledWith('/presets.json')

        expect(result.current.status).toBe('loading')            // straight away

        await waitFor(() => expect(result.current.status).toBe('error'))   // retried until it passes

        expect(result.current).toEqual({ status: 'error', error: 'Failed to fetch' })
    })
})