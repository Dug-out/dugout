import {getSelectableGames} from '../api/games.js'
import useLoad from './useLoad.js'

/**
 * 모집 글에 고를 수 있는 경기(시작 전, 내 팀 경기)를 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', games: object[], reload: () => void}}
 */
export default function useSelectableGames() {
    const {status, data, reload} = useLoad(getSelectableGames, [])
    return {status, games: data ?? [], reload}
}
