import {useEffect, useState} from 'react'
import {getMatePost} from '../api/mate.js'

/**
 * 모집 글 하나를 불러온다.
 * @param {string} id 모집 글 id
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', post: object | null, reload: () => void}}
 *  notfound: 없는 글이거나 다른 팀 글 / post: ready 일 때만 값이 있고 그 외에는 null
 *  reload: 불러오기에 실패했을 때 "다시 시도" 버튼이 부른다
 */
export default function useMatePost(id) {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error' | 'notfound', post: object | null}} */
        ({status: 'loading', post: null}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다 (다시 시도)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        // 화면을 떠나거나 다른 글로 바뀌면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        getMatePost(id)
            .then((post) => !stale && setState(post ? {status: 'ready', post} : {status: 'notfound', post: null}))
            .catch(() => !stale && setState({status: 'error', post: null}))

        return () => {
            stale = true
        }
    }, [id, retry])

    // 다시 시도 · 불러오는 중으로 되돌린 뒤 다시 불러온다
    const reload = () => {
        setState({status: 'loading', post: null})
        setRetry((n) => n + 1)
    }

    return {...state, reload}
}
