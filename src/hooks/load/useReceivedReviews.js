import {getReceivedReviews} from '../../api/mateReviews.js'
import useLoad from '../useLoad.js'

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
    const {status, data, reload} = useLoad(() => getReceivedReviews(userId, limit), [userId, limit])
    return {status, reviews: data?.reviews ?? [], total: data?.total ?? 0, reload}
}
