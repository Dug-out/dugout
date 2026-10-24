import {useEffect, useState} from 'react'

// 입력을 멈추고 이만큼 기다린 뒤에 확인한다 (글자를 칠 때마다 요청이 가지 않게)
const DEBOUNCE_MS = 500

/**
 * 입력을 멈추면 중복 확인을 자동으로 한다.
 * @param {string} value 확인할 값
 * @param {boolean} valid 형식이 맞는지 (valid가 true일 때만 확인)
 * @param {(value: string) => Promise<boolean | null>} check true 사용 가능 / false 중복 / null 확인 실패
 * @returns {'idle' | 'checking' | 'ok' | 'taken' | 'failed'}
 */
export default function useAvailability(value, valid, check) {
    // 마지막으로 확인한 결과 · 어떤 값에 대한 결과인지(value)를 같이 저장한다
    const [result, setResult] = useState({value: '', status: 'idle'})

    // value 나 valid 가 바뀔 때마다 실행된다
    useEffect(() => {
        // 형식이 틀리면 확인하지 않는다
        if (!valid) return undefined

        // 값이 바뀌면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        const timer = setTimeout(async () => {
            setResult({value, status: 'checking'})
            // true: 사용 가능, false: 이미 있음, null: 확인 실패
            const available = await check(value)
            if (stale) return
            setResult({value, status: available === null ? 'failed' : available ? 'ok' : 'taken'})
        }, DEBOUNCE_MS)

        // 값이 또 바뀌거나 화면이 사라질 때 · 아직 안 보낸 요청을 취소하고 옛 응답은 무시한다
        return () => {
            stale = true
            clearTimeout(timer)
        }
    }, [value, valid, check])

    // 형식이 틀렸거나, 아직 이 값으로 확인한 적이 없으면 idle
    return valid && result.value === value ? result.status : 'idle'
}
