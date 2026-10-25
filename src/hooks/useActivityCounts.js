import {useEffect, useState} from 'react'
import {getReviewTodoCount} from '../api/mateReviews.js'
import {getPendingApplicantCount} from '../api/mateMembers.js'

/**
 * 마이페이지 내 활동에 보여 줄 개수.
 * pending: 경기가 안 지난 내 모집 글에 들어온 새 신청 수 / waiting: 평가 대기 수
 * 불러오지 못한 쪽은 null 이고, 화면은 그 개수를 보여 주지 않는다.
 * @returns {{pending: number | null, waiting: number | null}}
 */
export default function useActivityCounts() {
    const [counts, setCounts] = useState(
        /** @type {{pending: number | null, waiting: number | null}} */ ({pending: null, waiting: null}),
    )

    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        // 한쪽이 실패해도 다른 쪽은 보여 준다
        Promise.allSettled([getPendingApplicantCount(), getReviewTodoCount()]).then(([pending, waiting]) => {
            if (stale) return
            setCounts({
                pending: pending.status === 'fulfilled' ? pending.value : null,
                waiting: waiting.status === 'fulfilled' ? waiting.value : null,
            })
        })

        return () => {
            stale = true
        }
    }, [])

    return counts
}
