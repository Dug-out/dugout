import {useEffect, useState} from 'react'
import {getReceivedReviews} from '../api/mateReviews.js'

// 후기 목록을 한 번에 가져오는 최대 개수
const LIST_LIMIT = 100

/**
 * 받은 후기를 불러온다.
 * @param {string | null} userId 받은 사람 id · null 이면 나
 * @param {number} limit 가져올 최대 개수
 * @returns {{status: 'loading' | 'ready' | 'error', reviews: object[], total: number, reload: () => void}}
 *  total: 받은 후기 전체 개수 (limit 보다 클 수 있다) / reviews 와 total 은 ready 일 때만 값이 있다
 */
export default function useReceivedReviews(userId, limit = LIST_LIMIT) {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error', reviews: object[], total: number}} */
        ({status: 'loading', reviews: [], total: 0}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다 (다시 시도)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        getReceivedReviews(userId, limit)
            .then(({reviews, total}) => !stale && setState({status: 'ready', reviews, total}))
            .catch(() => !stale && setState({status: 'error', reviews: [], total: 0}))

        return () => {
            stale = true
        }
    }, [userId, limit, retry])

    // 다시 시도 · 불러오는 중으로 되돌린 뒤 다시 불러온다
    const reload = () => {
        setState({status: 'loading', reviews: [], total: 0})
        setRetry((n) => n + 1)
    }

    return {...state, reload}
}
