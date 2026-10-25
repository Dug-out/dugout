import {getReviewTodos} from '../api/mateReviews.js'
import useLoad from './useLoad.js'

/**
 * 평가할 메이트 한 명을 불러온다.
 * @param {string} postId 모집 글 id
 * @param {string} userId 평가받을 사람 id
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', target: object | null, reload: () => void}}
 *  notfound: 이미 평가했거나 평가 기간이 지난 경우 / target: ready 일 때만 값이 있다
 */
export default function useReviewTarget(postId, userId) {
    // 평가 대기 목록에서 찾는다 · 이미 평가했거나 7일이 지났으면 목록에 없어서 null (= notfound)
    const {status, data, reload} = useLoad(async () => {
        const todos = await getReviewTodos()
        return todos.find((todo) => todo.postId === postId && todo.userId === userId) ?? null
    }, [postId, userId])
    return {status, target: data, reload}
}
