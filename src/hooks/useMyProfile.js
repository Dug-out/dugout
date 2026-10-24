import {useEffect, useState} from 'react'
import {getMyProfile} from '../api/profiles.js'

/**
 * 내 프로필 불러오기
 * @returns {{status: 'loading' | 'ready' | 'error', profile: object | null, reload: () => void}}
 *  reload: 불러오기에 실패했을 때 "다시 시도" 버튼이 부른다
 */
export default function useMyProfile() {
    const [state, setState] = useState({status: 'loading', profile: null})
    const [retry, setRetry] = useState(0) // 올릴 때마다 effect 가 다시 실행된다

    useEffect(() => {
        let stale = false // 화면을 떠난 뒤 도착한 응답은 버린다
        getMyProfile()
            .then((profile) => !stale && setState({status: 'ready', profile}))
            .catch(() => !stale && setState({status: 'error', profile: null}))
        return () => {
            stale = true
        }
    }, [retry])

    const reload = () => {
        setState({status: 'loading', profile: null})
        setRetry((n) => n + 1)
    }

    return {...state, reload}
}
