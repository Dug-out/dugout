import {useEffect, useState} from 'react'
import {getProfile} from '../api/profiles.js'

/**
 * 다른 사람의 프로필을 불러온다.
 * @param {string} id 보려는 사람의 id
 * @returns {{status: 'loading' | 'ready' | 'error', profile: object | null, reload: () => void}}
 *  useMyProfile 과 같은 모양이다 · profile 은 ready 일 때만 값이 있다
 */
export default function useProfile(id) {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error', profile: object | null}} */
        ({status: 'loading', profile: null}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다 (다시 시도)
    const [retry, setRetry] = useState(0)

    // 화면이 뜰 때, 보는 사람(id)이 바뀔 때, retry 가 바뀔 때마다 실행된다
    useEffect(() => {
        // 화면을 떠나거나 다른 사람으로 바뀌면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        getProfile(id)
            .then((profile) => !stale && setState({status: 'ready', profile}))
            .catch(() => !stale && setState({status: 'error', profile: null}))

        return () => {
            stale = true
        }
    }, [id, retry])

    // 다시 시도 · 불러오는 중으로 되돌린 뒤 다시 불러온다
    const reload = () => {
        setState({status: 'loading', profile: null})
        setRetry((n) => n + 1)
    }

    return {...state, reload}
}
