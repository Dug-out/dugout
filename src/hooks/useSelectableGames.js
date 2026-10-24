import {useEffect, useState} from 'react'
import {getMyTeam, getSelectableGames} from '../api/mate.js'

/**
 * 모집 글에 고를 수 있는 경기(시작 전, 내 팀 경기)를 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', games: object[], reload: () => void}}
 *
 * DB 규칙(RLS)이 내 팀 경기만 돌려주지만, 규칙이 빠지거나 잘못돼도 다른 팀 경기가 보이지 않도록
 * 내 팀 코드로 한 번 더 거른다 (실제로 DB 규칙이 빠져 다른 팀 경기가 보인 적이 있다).
 */
export default function useSelectableGames() {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error', games: object[]}} */
        ({status: 'loading', games: []}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다 (다시 시도)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        // 경기 목록과 내 팀을 동시에 불러온다 (내 팀을 알아야 거를 수 있다)
        Promise.all([getSelectableGames(), getMyTeam()])
            .then(([games, team]) => {
                if (stale) return
                // 내 팀이 홈이거나 원정인 경기만 남긴다
                setState({status: 'ready', games: games.filter((game) => game.home === team || game.away === team)})
            })
            .catch(() => !stale && setState({status: 'error', games: []}))

        return () => {
            stale = true
        }
    }, [retry])

    // 다시 시도 · 불러오는 중으로 되돌린 뒤 다시 불러온다
    const reload = () => {
        setState({status: 'loading', games: []})
        setRetry((n) => n + 1)
    }

    return {...state, reload}
}
