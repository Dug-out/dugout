// 메이트 찾기 화면이 데이터를 불러올 때 쓰는 hook 모음
// 화면 파일(Mate.jsx)에는 "무엇을 보여 줄지"만 남기고, "언제·어떻게 불러올지"는 여기 모았다.
//
// 공통 패턴 (기존 Signup/useAvailability.js 와 같은 방식)
//  - 조건(팀·날짜·필터)을 글자 하나로 묶은 key를 만든다.
//  - 불러온 결과를 key와 함께 저장한다.
//  - 지금 key와 저장된 key가 다르면 "아직 새 조건으로 불러오는 중"으로 본다.
//  → 조건이 바뀌는 순간 이전 결과가 잠깐 보이는 일이 없고, 늦게 도착한 이전 응답은 버린다(stale).
import {useCallback, useEffect, useRef, useState} from 'react'
import {countMatePosts, getMatePosts, getMyTeam, getTeamGames} from '../../api/mate.js'

/**
 * 🔌 내 응원팀 코드 · getMyTeam() (profiles.team)
 * @returns {{team: string | null, failed: boolean}} 불러오는 중이면 team null
 */
export function useMyTeam() {
    const [state, setState] = useState({team: null, failed: false})

    useEffect(() => {
        let stale = false // 화면을 떠난 뒤 응답이 오면 무시
        getMyTeam()
            .then((team) => !stale && setState({team, failed: false}))
            .catch(() => !stale && setState({team: null, failed: true}))
        return () => {
            stale = true
        }
    }, [])

    return state
}

/**
 * 🔌 모집 글 목록 + 무한 스크롤 · getMatePosts()
 * 조건이 바뀌면 첫 페이지부터 다시 불러오고, loadMore()를 부르면 다음 페이지를 뒤에 붙인다.
 * @param {{team: string | null, date: Date | null, openOnly: boolean, sort: 'new' | 'old'}} filters
 */
export function useMatePosts({team, date, openOnly, sort}) {
    // retry: "다시 시도" 버튼을 누를 때마다 1씩 올려서 key를 바꾼다 → 첫 페이지를 다시 불러온다
    const [retry, setRetry] = useState(0)
    const key = team ? [team, date?.getTime() ?? 'all', openOnly, sort, retry].join('|') : ''

    // status: loading(첫 페이지 불러오는 중) | ready | error
    const [state, setState] = useState({key: '', items: [], page: 0, hasMore: false, status: 'loading', moreFailed: false})
    // 다음 페이지를 불러오는 중인지 · 스크롤 감지가 여러 번 와도 한 번만 요청하려고 ref로 둔다
    const loadingMore = useRef(false)
    const [moreLoading, setMoreLoading] = useState(false)

    // 첫 페이지 · 조건(key)이 바뀔 때마다
    useEffect(() => {
        if (!team) return undefined
        let stale = false
        getMatePosts({team, date, openOnly, sort, page: 0})
            .then(({items, hasMore}) => {
                if (!stale) setState({key, items, page: 0, hasMore, status: 'ready', moreFailed: false})
            })
            .catch(() => {
                if (!stale) setState({key, items: [], page: 0, hasMore: false, status: 'error', moreFailed: false})
            })
        return () => {
            stale = true
        }
    }, [key, team, date, openOnly, sort])

    // 저장된 결과가 지금 조건의 것이 아니면 "불러오는 중"으로 보여 준다
    const current = state.key === key ? state : {key, items: [], page: 0, hasMore: false, status: 'loading', moreFailed: false}

    // 다음 페이지 · 목록 맨 아래가 화면에 보이면 Mate.jsx가 부른다
    const loadMore = useCallback(async () => {
        if (current.status !== 'ready' || !current.hasMore || loadingMore.current) return
        loadingMore.current = true
        setMoreLoading(true)
        try {
            const next = await getMatePosts({team, date, openOnly, sort, page: current.page + 1})
            // 그사이 조건이 바뀌었으면(prev.key가 다르면) 붙이지 않는다
            setState((prev) => (prev.key === key
                ? {...prev, items: [...prev.items, ...next.items], page: prev.page + 1, hasMore: next.hasMore, moreFailed: false}
                : prev))
        } catch {
            // 다음 페이지만 실패 → 이미 보이는 글은 그대로 두고 "다시 불러오기" 버튼을 보여 준다
            setState((prev) => (prev.key === key ? {...prev, moreFailed: true} : prev))
        } finally {
            loadingMore.current = false
            setMoreLoading(false)
        }
    }, [current.status, current.hasMore, current.page, key, team, date, openOnly, sort])

    return {
        ...current,
        moreLoading,
        loadMore, // 다음 페이지 실패 후 "다시 불러오기" 버튼도 이 함수를 그대로 부른다
        reload: () => setRetry((n) => n + 1), // 첫 페이지 실패 시 "다시 시도"
    }
}

/**
 * 🔌 한 달 동안의 내 팀 경기 · getTeamGames() · 달력의 빨간 점에 쓴다
 * @returns {object[]} 불러오는 중이거나 실패하면 빈 배열 (점만 안 보이고 달력은 쓸 수 있다)
 */
export function useMonthGames(team, month) {
    const key = team ? `${team}|${month.getTime()}` : ''
    const [state, setState] = useState({key: '', games: []})

    useEffect(() => {
        if (!team) return undefined
        let stale = false
        const to = new Date(month)
        to.setMonth(to.getMonth() + 1) // 다음 달 1일 전까지
        getTeamGames({team, from: month, to})
            .then((games) => !stale && setState({key, games}))
            .catch(() => !stale && setState({key, games: []}))
        return () => {
            stale = true
        }
    }, [key, team, month])

    return state.key === key ? state.games : []
}

/**
 * 🔌 고른 날짜의 모집 글 개수 · countMatePosts() · 달력 버튼 "10.22 모집 글 2개 보기"
 * @returns {number | null} 모르면 null (버튼은 "10.22 모집 글 보기"로 보인다)
 */
export function useDayCount(team, date, openOnly) {
    const key = team ? `${team}|${date.getTime()}|${openOnly}` : ''
    const [state, setState] = useState({key: '', count: null})

    useEffect(() => {
        if (!team) return undefined
        let stale = false
        countMatePosts({team, date, openOnly})
            .then((count) => !stale && setState({key, count}))
            .catch(() => !stale && setState({key, count: null}))
        return () => {
            stale = true
        }
    }, [key, team, date, openOnly])

    return state.key === key ? state.count : null
}
