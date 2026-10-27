import {getPredictionGame} from '../../api/predictions.js'
import useLoad from '../useLoad.js'

/**
 * 예측하기 화면 · 내 팀의 다음 경기, 내가 남긴 예측, 올 시즌 상대 전적을 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', data: object | null,
 *             reload: () => void, refresh: () => void}}
 *  notfound: 예측할 경기가 없다 / data: ready 일 때만 {game, myPick, record}
 */
export default function usePredictionGame() {
    return useLoad(getPredictionGame, [])
}
