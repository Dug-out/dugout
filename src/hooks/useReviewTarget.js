import {useEffect, useState} from 'react'
import {getReviewTodos} from '../api/mateReviews.js'

/**
 * 평가할 메이트 한 명을 불러온다.
 * @param {string} postId 모집 글 id
 * @param {string} userId 평가받을 사람 id
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', target: object | null, reload: () => void}}
 *  notfound: 이미 평가했거나 평가 기간이 지난 경우 / target: ready 일 때만 값이 있다
 */
export default function useReviewTarget(postId, userId) {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error' | 'notfound', target: object | null}} */
        ({status: 'loading', target: null}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다 (다시 시도)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        // 화면을 떠나거나 다른 사람으로 바뀌면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        // 평가 대기 목록에서 찾는다 · 이미 평가했거나 7일이 지났으면 목록에 없다
        getReviewTodos()
            .then((todos) => todos.find((todo) => todo.postId === postId && todo.userId === userId))
            .then(
                (target) => !stale && setState(target ? {status: 'ready', target} : {status: 'notfound', target: null}),
            )
            .catch(() => !stale && setState({status: 'error', target: null}))

        return () => {
            stale = true
        }
    }, [postId, userId, retry])

    // 다시 시도 · 불러오는 중으로 되돌린 뒤 다시 불러온다
    const reload = () => {
        setState({status: 'loading', target: null})
        setRetry((n) => n + 1)
    }

    return {...state, reload}
}
