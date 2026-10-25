import {useEffect, useState} from 'react'
import {getReceivedReviews, getReviewTodos} from '../api/mateReviews.js'

/**
 * 마이페이지에 보여 줄 개수 · 받은 후기와 평가 대기.
 * 불러오지 못하면 null 이고, 화면은 그 개수만 보여 주지 않는다.
 * @returns {{received: number, waiting: number} | null}
 */
export default function useReviewCounts() {
    const [counts, setCounts] = useState(/** @type {{received: number, waiting: number} | null} */ (null))

    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        Promise.all([getReceivedReviews(null, 0), getReviewTodos()])
            .then(([{total}, todos]) => !stale && setCounts({received: total, waiting: todos.length}))
            .catch(() => {})

        return () => {
            stale = true
        }
    }, [])

    return counts
}
