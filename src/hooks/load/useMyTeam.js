import {getMyTeam} from '../../api/profiles.js'
import useLoad from '../useLoad.js'

/**
 * 내 응원팀 코드('KIA' 등)를 불러온다 · 아직 불러오지 못했거나 실패하면 null
 * 다른 훅과 달리 status 없이 값만 돌려준다 (경기 이름을 내 팀 먼저 쓰는 데만 쓰여서, 못 불러와도 화면은 그대로 보인다)
 */
export default function useMyTeam() {
    return useLoad(getMyTeam, []).data
}
