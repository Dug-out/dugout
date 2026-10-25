import {getMyProfile} from '../../api/profiles.js'
import useLoad from '../useLoad.js'

/**
 * 내 프로필을 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', profile: object | null, reload: () => void}}
 *  profile: 불러온 내 프로필 {nickname, team, gender, age, headline, bio, manner} · ready 일 때만 값이 있고 그 외에는 null
 *  reload: 불러오기에 실패했을 때 "다시 시도" 버튼이 부른다
 */
export default function useMyProfile() {
    const {status, data: profile, reload} = useLoad(getMyProfile, [])
    return {status, profile, reload}
}
