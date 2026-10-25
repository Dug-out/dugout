import {useEffect, useState} from 'react'
import {getMyReviews, getReviewTodos} from '../api/mateReviews.js'

/**
 * 메이트 평가하기 화면에 쓸 목록을 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', todos: object[], done: object[], reload: () => void}}
 *  todos: 평가 대기 / done: 지난 평가 · ready 일 때만 값이 있다
 */
export default function useReviewList() {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error', todos: object[], done: object[]}} */
        ({status: 'loading', todos: [], done: []}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다 (다시 시도)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        Promise.all([getReviewTodos(), getMyReviews()])
            .then(([todos, done]) => !stale && setState({status: 'ready', todos, done}))
            .catch(() => !stale && setState({status: 'error', todos: [], done: []}))

        return () => {
            stale = true
        }
    }, [retry])

    // 다시 시도 · 불러오는 중으로 되돌린 뒤 다시 불러온다
    const reload = () => {
        setState({status: 'loading', todos: [], done: []})
        setRetry((n) => n + 1)
    }

    return {...state, reload}
}
