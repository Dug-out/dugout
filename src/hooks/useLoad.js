import {useEffect, useState} from 'react'

/**
 * 화면에 필요한 데이터를 불러온다 · 데이터를 불러오는 훅들이 함께 쓰는 뼈대.
 * @param {() => Promise<any>} load 데이터를 불러오는 함수 (결과가 null 이면 "없음"으로 본다)
 * @param {any[]} deps load 가 쓰는 값들 (예: [id]) · 바뀌면 다시 불러온다
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', data: any, reload: () => void, refresh: () => void}}
 *  data: ready 일 때만 값이 있다 (그 외에는 null)
 *  reload: 화면을 불러오는 중으로 되돌린 뒤 다시 불러온다 ("다시 시도")
 *  refresh: 화면은 그대로 두고 조용히 다시 불러온다 (수락·거절처럼 처리한 뒤 갱신)
 */
export default function useLoad(load, deps) {
    const [state, setState] = useState(
        /** @type {{status: 'loading' | 'ready' | 'error' | 'notfound', data: any}} */
        ({status: 'loading', data: null}),
    )

    // 올릴 때마다 아래 effect 가 다시 실행된다
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        // 화면을 떠나거나 deps 가 바뀌면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        load()
            .then(
                (data) =>
                    !stale && setState(data === null ? {status: 'notfound', data: null} : {status: 'ready', data}),
            )
            .catch(() => !stale && setState({status: 'error', data: null}))

        return () => {
            stale = true
        }
        // load 는 매번 새로 만들어지므로 deps 로 다시 불러올 때를 정한다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, retry])

    const refresh = () => setRetry((n) => n + 1)

    const reload = () => {
        setState({status: 'loading', data: null})
        refresh()
    }

    return {...state, reload, refresh}
}
