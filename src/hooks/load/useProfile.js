import {getProfile} from '../../api/profiles.js'
import useLoad from '../useLoad.js'

/**
 * 다른 사람의 프로필을 불러온다.
 * @param {string} id 보려는 사람의 id
 * @returns {{status: 'loading' | 'ready' | 'error', profile: object | null, reload: () => void}}
 *  useMyProfile 과 같은 모양이다 · profile 은 ready 일 때만 값이 있다
 */
export default function useProfile(id) {
    const {status, data: profile, reload} = useLoad(() => getProfile(id), [id])
    return {status, profile, reload}
}
