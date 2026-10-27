import {getMyPredictions} from '../../api/predictions.js'
import useLoad from '../useLoad.js'

/**
 * 내 예측 내역 · 경기가 최근인 것부터
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', picks: object[] | null,
 *             reload: () => void, refresh: () => void}}
 *  picks: ready 일 때만 값이 있다 · 예측이 없으면 빈 목록 []
 */
export default function useMyPredictions() {
    const {status, data: picks, reload, refresh} = useLoad(getMyPredictions, [])
    return {status, picks, reload, refresh}
}
