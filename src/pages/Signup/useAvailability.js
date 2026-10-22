import {useEffect, useState} from 'react'

const DEBOUNCE_MS = 500

/**
 * 입력을 멈추면 중복 확인을 자동으로 한다.
 * valid가 true일 때만 확인하고, 값이 바뀌면 이전 결과는 버린다.
 * @param {string} value 확인할 값
 * @param {boolean} valid 형식이 맞는지 (맞아야 확인 요청을 보낸다)
 * @param {(value: string) => Promise<boolean | null>} check true 사용 가능 / false 중복 / null 확인 실패
 * @returns {'idle' | 'checking' | 'ok' | 'taken' | 'failed'}
 */
export default function useAvailability(value, valid, check) {
    const [result, setResult] = useState({value: '', status: 'idle'})

    useEffect(() => {
        if (!valid) return undefined
        let stale = false
        const timer = setTimeout(async () => {
            setResult({value, status: 'checking'})
            const available = await check(value)
            if (stale) return
            setResult({value, status: available === null ? 'failed' : available ? 'ok' : 'taken'})
        }, DEBOUNCE_MS)
        return () => {
            stale = true
            clearTimeout(timer)
        }
    }, [value, valid, check])

    // 형식이 틀렸거나, 아직 이 값으로 확인한 적이 없으면 idle
    return valid && result.value === value ? result.status : 'idle'
}
