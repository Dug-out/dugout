import {getMyPosts} from '../api/mateMembers.js'
import useLoad from './useLoad.js'

/**
 * 내 직관 약속을 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', data: object[] | null, reload: () => void}}
 *  data: 내 약속 목록 · ready 일 때만 값이 있다 (그 외에는 null)
 */
export default function useMyPosts() {
    const {status, data, reload} = useLoad(getMyPosts, [])
    return {status, data, reload}
}
