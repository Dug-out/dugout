import {useEffect, useState} from 'react'
import {getMyProfile} from '../api/profiles.js'

/**
 * 내 프로필을 불러온다.
 * @returns {{status: 'loading' | 'ready' | 'error', profile: object | null, reload: () => void}}
 *  profile: 불러온 내 프로필 {nickname, team, gender, age, headline, bio, manner} · ready 일 때만 값이 있고 그 외에는 null
 *  reload: 불러오기에 실패했을 때 "다시 시도" 버튼이 부른다
 */
export default function useMyProfile() {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error', profile: object | null}} */
        ({status: 'loading', profile: null}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다 (다시 시도)
    const [retry, setRetry] = useState(0)

    // 화면이 뜰 때와 retry 가 바뀔 때마다 실행된다
    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        getMyProfile()
            // 성공 · 받은 프로필을 담고 ready 로 바꾼다
            .then((profile) => !stale && setState({status: 'ready', profile}))
            // 실패 · 프로필은 비우고 error 로 바꾼다
            .catch(() => !stale && setState({status: 'error', profile: null}))

        // 화면이 사라질 때 · 이미 보낸 요청의 응답은 무시한다
        return () => {
            stale = true
        }
    }, [retry])

    // 다시 시도 · 프로필을 비우고 불러오는 중으로 되돌린 뒤, retry 를 올려서 다시 불러온다
    const reload = () => {
        setState({status: 'loading', profile: null})
        setRetry((n) => n + 1)
    }

    // status 와 profile 을 펼쳐서 내보낸다 (화면에서는 const {status, profile, reload} 로 받는다)
    return {...state, reload}
}
