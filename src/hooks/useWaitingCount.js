import {useEffect, useState} from 'react'
import {getReviewTodos} from '../api/mateReviews.js'

/**
 * 마이페이지에 보여 줄 평가 대기 개수.
 * 불러오지 못하면 null 이고, 화면은 개수를 보여 주지 않는다.
 * @returns {number | null}
 */
export default function useWaitingCount() {
    const [count, setCount] = useState(/** @type {number | null} */ (null))

    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        getReviewTodos()
            .then((todos) => !stale && setCount(todos.length))
            .catch(() => {})

        return () => {
            stale = true
        }
    }, [])

    return count
}
