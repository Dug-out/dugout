import {getRanking} from '../../api/predictions.js'
import useLoad from '../useLoad.js'

/**
 * 승부 예측 랭킹 · 같은 응원팀의 1~10위와 내 줄 (내가 10위 밖이어도 따라온다)
 * @param {'month' | 'season'} period 월간 / 시즌 · 바뀌면 다시 불러온다
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', ranking: object[] | null,
 *             reload: () => void, refresh: () => void}}
 *  ranking: ready 일 때만 값이 있다 · 순위가 없으면 빈 목록 []
 */
export default function useRanking(period) {
    const {status, data: ranking, reload, refresh} = useLoad(() => getRanking(period), [period])
    return {status, ranking, reload, refresh}
}
