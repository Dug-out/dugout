import {getWeekGameCount} from '../../api/games.js'
import useLoad from '../useLoad.js'

/**
 * 이번 주 남은 내 팀 경기 수
 * @returns {number | null} 아직 불러오지 못했거나 실패하면 null (홈 안내를 숨긴다)
 */
export default function useWeekGameCount() {
    return useLoad(getWeekGameCount, []).data
}
