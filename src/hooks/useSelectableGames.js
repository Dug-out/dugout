import {useEffect, useState} from 'react'
import {getSelectableGames} from '../api/mate.js'

/**
 * 모집 글에 고를 수 있는 경기(시작 전, 내 팀 경기)를 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', games: object[], reload: () => void}}
 *
 * 내 팀 경기만 오는 것은 DB 규칙(RLS)이 맡는다 (supabase/schema/02_games.sql).
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

        getSelectableGames()
            .then((games) => !stale && setState({status: 'ready', games}))
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
