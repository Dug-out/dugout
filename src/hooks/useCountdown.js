import {useEffect, useState} from 'react'

/**
 * 목표 시각까지 남은 시간(ms)을 1초마다 다시 센다 · 지나면 0
 * @param {number | null} target 목표 시각 (ms) · null 이면 세지 않는다
 */
export default function useCountdown(target) {
    // 지금 시각 · 1초마다 바뀐다
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (target === null) return
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [target])

    return target === null ? 0 : Math.max(0, target - now)
}
