import {getMyReviews, getReviewTodos} from '../api/mateReviews.js'
import useLoad from './useLoad.js'

/**
 * 메이트 평가하기 화면에 쓸 목록을 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', todos: object[], done: object[], reload: () => void}}
 *  todos: 평가 대기 / done: 지난 평가 · ready 일 때만 값이 있다
 */
export default function useReviewList() {
    const {status, data, reload} = useLoad(async () => {
        const [todos, done] = await Promise.all([getReviewTodos(), getMyReviews()])
        return {todos, done}
    }, [])
    return {status, todos: data?.todos ?? [], done: data?.done ?? [], reload}
}
