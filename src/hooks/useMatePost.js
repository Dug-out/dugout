import {getMatePost} from '../api/matePosts.js'
import useLoad from './useLoad.js'

/**
 * 모집 글 하나를 불러온다.
 * @param {string} id 모집 글 id
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', post: object | null,
 *             reload: () => void, refresh: () => void}}
 *  notfound: 없는 글이거나 다른 팀 글 / post: ready 일 때만 값이 있고 그 외에는 null
 *  reload: 불러오기에 실패했을 때 "다시 시도" / refresh: 화면은 그대로 두고 값만 다시 불러온다
 */
export default function useMatePost(id) {
    const {status, data: post, reload, refresh} = useLoad(() => getMatePost(id), [id])
    return {status, post, reload, refresh}
}
