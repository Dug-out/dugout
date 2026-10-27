import {getPredictionSummary} from '../../api/predictions.js'
import useLoad from '../useLoad.js'

/**
 * 내 누적 점수와 순위 · 이번 달 · 이번 시즌
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', summary: object | null,
 *             reload: () => void, refresh: () => void}}
 *  summary: ready 일 때만 {month: {points, rank}, season: {points, rank}} · rank 는 채점된 예측이 없으면 null
 */
export default function usePredictionSummary() {
    const {status, data: summary, reload, refresh} = useLoad(getPredictionSummary, [])
    return {status, summary, reload, refresh}
}
