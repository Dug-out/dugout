import {getGameStats} from '../../api/predictions.js'
import useLoad from '../useLoad.js'

/**
 * 한 경기의 팬 예측 비율 · 같은 응원팀 팬들의 승·무·패 수와 가장 많이 예측한 스코어
 * @param {number} gameId 경기 id
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', stats: object | null,
 *             reload: () => void, refresh: () => void}}
 *  refresh: 예측을 저장한 뒤 화면은 그대로 두고 비율만 다시 불러온다
 */
export default function useGameStats(gameId) {
    const {status, data: stats, reload, refresh} = useLoad(() => getGameStats(gameId), [gameId])
    return {status, stats, reload, refresh}
}
