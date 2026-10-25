import {useEffect, useState} from 'react'
import {getMateApplicants} from '../api/mateMembers.js'

/**
 * 신청자 관리에 쓸 데이터를 불러온다.
 * @param {string} postId 모집 글 id
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', data: object | null, reload: () => void, refresh: () => void}}
 *  notfound: 없는 글이거나 내가 방장이 아닌 글 / reload: "다시 시도" / refresh: 화면은 그대로 두고 값만 다시 불러온다
 */
export default function useMateApplicants(postId) {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error' | 'notfound', data: object | null}} */
        ({status: 'loading', data: null}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        // 화면을 떠나거나 다른 글로 바뀌면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        getMateApplicants(postId)
            .then((data) => !stale && setState(data ? {status: 'ready', data} : {status: 'notfound', data: null}))
            .catch(() => !stale && setState({status: 'error', data: null}))

        return () => {
            stale = true
        }
    }, [postId, retry])

    // 수락·거절 직후처럼 화면을 그대로 두고 값만 다시 불러온다
    const refresh = () => setRetry((n) => n + 1)

    // 다시 시도 · 불러오는 중으로 되돌린 뒤 다시 불러온다
    const reload = () => {
        setState({status: 'loading', data: null})
        refresh()
    }

    return {...state, reload, refresh}
}
