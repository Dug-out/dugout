import {useEffect, useState} from 'react'
import {getMyPosts} from '../api/mateMembers.js'

/**
 * 내 직관 약속을 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', data: {myTeam: string, items: object[]} | null, reload: () => void}}
 *  data: ready 일 때만 값이 있다 · 그 외에는 null
 */
export default function useMyPosts() {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error', data: {myTeam: string, items: object[]} | null}} */
        ({status: 'loading', data: null}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다 (다시 시도)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        getMyPosts()
            .then((data) => !stale && setState({status: 'ready', data}))
            .catch(() => !stale && setState({status: 'error', data: null}))

        return () => {
            stale = true
        }
    }, [retry])

    // 다시 시도 · 불러오는 중으로 되돌린 뒤 다시 불러온다
    const reload = () => {
        setState({status: 'loading', data: null})
        setRetry((n) => n + 1)
    }

    return {...state, reload}
}
