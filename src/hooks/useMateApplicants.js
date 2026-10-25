import {getMateApplicants} from '../api/mateMembers.js'
import useLoad from './useLoad.js'

/**
 * 신청자 관리에 쓸 데이터를 불러온다.
 * @param {string} postId 모집 글 id
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', data: object | null, reload: () => void, refresh: () => void}}
 *  notfound: 없는 글이거나 내가 방장이 아닌 글 / reload: "다시 시도" / refresh: 화면은 그대로 두고 값만 다시 불러온다
 */
export default function useMateApplicants(postId) {
    return useLoad(() => getMateApplicants(postId), [postId])
}
