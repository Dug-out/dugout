import {useRef, useState, useEffect} from 'react'
import {getMatePosts} from '../../api/matePosts.js'

/**
 * 메이트 찾기 목록을 쪽 단위로 불러와 이어 붙인다 (무한 스크롤).
 * 조건(date, openOnly, sort)이 바뀌면 첫 쪽부터 다시 불러온다.
 * @param {{date?: Date | null, openOnly?: boolean, sort?: 'new' | 'old'}} [filters]
 * @returns {{status: 'loading' | 'ready' | 'error', posts: object[], hasMore: boolean, loadingMore: boolean,
 *            moreFailed: boolean, loadMore: () => void, reload: () => void}}
 *  status: 첫 쪽 상태 / loadingMore · moreFailed: 다음 쪽을 불러오는 중 · 실패
 *  loadMore: 목록 끝에 닿았을 때 다음 쪽 (실패 뒤 "다시 불러오기"도 이걸 부른다)
 *  reload: 첫 쪽을 불러오지 못했을 때 "다시 시도"
 */
export default function useMatePostList({date = null, openOnly = false, sort = 'new'} = {}) {
    // 올릴 때마다 첫 쪽부터 다시 불러온다 ("다시 시도")
    const [retry, setRetry] = useState(0)

    // 지금 조건을 글자 하나로 · 저장된 목록이 어느 조건의 것인지 구별한다
    const key = `${date ? date.getTime() : 'all'}|${openOnly}|${sort}|${retry}`

    const [state, setState] = useState({
        key: '',
        status: 'loading',
        posts: [],
        page: 0,
        hasMore: false,
        loadingMore: false,
        moreFailed: false,
    })

    // 다음 쪽을 부르는 중인지 · 스크롤 감지가 연달아 와도 한 번만 요청한다
    const loadingRef = useRef(false)

    // 첫 쪽 · 조건이 바뀔 때마다
    useEffect(() => {
        // 조건이 바뀐 뒤 늦게 도착한 옛 응답은 버린다
        let stale = false

        getMatePosts({date, openOnly, sort, page: 0})
            .then(
                ({posts, hasMore}) =>
                    !stale &&
                    setState({key, status: 'ready', posts, page: 0, hasMore, loadingMore: false, moreFailed: false}),
            )
            .catch(
                () =>
                    !stale &&
                    setState({
                        key,
                        status: 'error',
                        posts: [],
                        page: 0,
                        hasMore: false,
                        loadingMore: false,
                        moreFailed: false,
                    }),
            )

        return () => {
            stale = true
        }
        // date 는 매번 새 객체일 수 있어서 key 로 다시 불러올 때를 정한다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    // 저장된 목록이 지금 조건의 것이 아니면 불러오는 중으로 본다 (조건을 바꾼 순간 옛 목록이 보이지 않게)
    const current =
        state.key === key
            ? state
            : {key, status: 'loading', posts: [], page: 0, hasMore: false, loadingMore: false, moreFailed: false}

    // 다음 쪽 · 받은 글을 뒤에 붙인다
    const loadMore = async () => {
        if (current.status !== 'ready' || !current.hasMore || loadingRef.current) return
        loadingRef.current = true
        setState((prev) => (prev.key === key ? {...prev, loadingMore: true, moreFailed: false} : prev))

        try {
            const next = await getMatePosts({date, openOnly, sort, page: current.page + 1})
            setState((prev) => {
                // 그사이 조건이 바뀌었으면 붙이지 않는다
                if (prev.key !== key) return prev
                // 새 글이 올라와 쪽이 밀리면 같은 글이 또 올 수 있어서 이미 있는 글은 뺀다
                const seen = new Set(prev.posts.map((post) => post.id))
                const added = next.posts.filter((post) => !seen.has(post.id))
                return {
                    ...prev,
                    posts: [...prev.posts, ...added],
                    page: prev.page + 1,
                    hasMore: next.hasMore,
                    loadingMore: false,
                }
            })
        } catch {
            // 이미 보이는 글은 그대로 두고 "다시 불러오기"를 보여 줄 수 있게 표시만 한다
            setState((prev) => (prev.key === key ? {...prev, loadingMore: false, moreFailed: true} : prev))
        } finally {
            loadingRef.current = false
        }
    }

    const reload = () => setRetry((n) => n + 1)

    const {status, posts, hasMore, loadingMore, moreFailed} = current
    return {status, posts, hasMore, loadingMore, moreFailed, loadMore, reload}
}
