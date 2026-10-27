import {useEffect, useRef, useState} from 'react'
import {Link} from 'react-router'
import {Button, EmptyState, Icon, LoadState, MateCard} from '../../components'
import {MATE_POST, SIGNUP} from '../../constants/policy.js'
import useMatePostList from '../../hooks/load/useMatePostList.js'
import useMyTeam from '../../hooks/load/useMyTeam.js'
import {formatDay, formatDday, formatTime, matchLabel} from '../../utils/mateFormat.js'
import MateGameSheet from './components/MateGameSheet.jsx'
import './Mate.css'

// 그날 0시
const startOfDay = (value) => {
    const date = new Date(value)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// 'MM.DD' · 달력 버튼 문구
const monthDay = (value) => {
    const date = new Date(value)
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

// 카드 조건 태그 · [좌석] [나이대] [성별]
const conditionTags = ({seat, ages, gender}) => [
    seat,
    ages.length ? ages.join('·') : '나이 무관',
    gender === '무관' ? '성별 무관' : `${gender}만`,
]

/** 메이트 찾기 · 같은 팀 팬의 모집 글 목록 (날짜 · 모집 중만 · 정렬 · 무한 스크롤) */
function Mate() {
    // 내 응원팀 · 배지와 경기 이름에 쓴다 (못 불러와도 목록은 보인다)
    const myTeam = useMyTeam()
    const teamName = SIGNUP.TEAMS.find((team) => team.code === myTeam)?.name

    // 고른 날의 내 팀 경기 (null 이면 전체 날짜) · 경기가 있는 날만 고를 수 있다
    const [dateGame, setDateGame] = useState(null)
    // 목록을 거를 날짜 · 고른 경기의 그날 0시
    const date = dateGame ? startOfDay(dateGame.gameAt) : null
    // 모집 중인 글만 보기 / 정렬 · new 최신순, old 오래된순
    const [openOnly, setOpenOnly] = useState(false)
    const [sort, setSort] = useState('new')
    // 날짜 달력 시트가 열려 있는지
    const [dateSheetOpen, setDateSheetOpen] = useState(false)

    // 조건이 바뀌면 첫 쪽부터 다시 불러온다 · status 는 loading | ready | error
    const {status, posts, hasMore, loadingMore, moreFailed, loadMore, reload} = useMatePostList({
        date,
        openOnly,
        sort,
    })

    // 달력에서 경기 날을 골랐을 때(경기) · [전체 날짜]를 눌렀을 때(null)
    const applyDate = (game) => {
        setDateGame(game)
        setDateSheetOpen(false)
    }

    // 날짜 버튼 문구 · '전체 날짜' / '10.22 (목) LG vs 두산'
    const dateLabel = dateGame ? `${formatDay(dateGame.gameAt)} ${matchLabel(dateGame, myTeam)}` : '전체 날짜'

    return (
        <div className="mate">
            <header className="mate__head">
                <div className="mate__head-top">
                    <h1 className="mate__title">메이트 찾기</h1>
                    {teamName && <span className="mate__team">{teamName} 팬만 보여요</span>}
                </div>

                {/* 날짜 버튼 · 누르면 달력 시트 */}
                <button
                    type="button"
                    className="mate__date"
                    aria-haspopup="dialog"
                    onClick={() => setDateSheetOpen(true)}
                >
                    <Icon name="calendar" size={18} />
                    <span className="mate__date-label">{dateLabel}</span>
                    <Icon name="chevronRight" size={16} className="mate__date-arrow" />
                </button>

                <div className="mate__filters">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={openOnly}
                        className="mate__open-only"
                        onClick={() => setOpenOnly((on) => !on)}
                    >
                        <span className="mate__check">
                            {openOnly && <Icon name="check" size={14} strokeWidth={3} />}
                        </span>
                        모집 중인 글만 보기
                    </button>

                    <div role="radiogroup" aria-label="정렬" className="mate__sort">
                        {[
                            ['new', '최신순'],
                            ['old', '오래된순'],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={sort === value}
                                className="mate__sort-btn"
                                onClick={() => setSort(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 목록 · 모집 마감 카드는 Mate.css 에서 흑백으로 덮어쓴다 */}
            <main className="mate__list">
                <LoadState status={status} errorTitle="모집 글을 불러오지 못했어요" onRetry={reload} />
                {status === 'ready' && posts.length === 0 && (
                    <EmptyState
                        title="조건에 맞는 모집 글이 없어요"
                        description="직접 글을 올려 같이 갈 메이트를 모아 보세요"
                    />
                )}
                {status === 'ready' && posts.length > 0 && (
                    <PostList
                        posts={posts}
                        myTeam={myTeam}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                        moreFailed={moreFailed}
                        loadMore={loadMore}
                    />
                )}

                {/* 모집 글 쓰기 · 탭바 위에 떠 있는 빨간 알약 버튼 (메이트 찾기 목록에만) */}
                <div className="mate__fab-wrap">
                    <Link to="/mate/write" className="mate__fab">
                        <Icon name="plus" size={20} strokeWidth={2.2} />
                        모집 글 쓰기
                    </Link>
                </div>
            </main>

            {/* 날짜 달력 시트 · 글쓰기 경기 선택과 같은 달력 (경기 있는 날만) · 열 때마다 지금 고른 날로 시작한다 */}
            {dateSheetOpen && (
                <MateGameSheet
                    myTeam={myTeam}
                    title="직관 날짜 선택"
                    selectedId={dateGame?.id ?? null}
                    onClose={() => setDateSheetOpen(false)}
                    footer={(picked) => (
                        <div className="mate-cal__actions">
                            <Button variant="secondary" onClick={() => applyDate(null)}>
                                전체 날짜
                            </Button>
                            <Button block disabled={!picked} onClick={() => applyDate(picked)}>
                                {picked ? `${monthDay(picked.gameAt)} 모집 글 보기` : '날짜를 골라 주세요'}
                            </Button>
                        </div>
                    )}
                />
            )}
        </div>
    )
}

/** 불러온 글 카드들 · 맨 아래에 닿으면 다음 쪽을 불러온다 */
function PostList({posts, myTeam, hasMore, loadingMore, moreFailed, loadMore}) {
    // 화면이 뜬 시각 · D-day 를 셀 때 쓴다
    const [now] = useState(() => Date.now())

    // 맨 아래 빈 칸이 화면에 들어오면 다음 쪽 · loadMore 는 렌더링마다 새로 만들어져서 최신 것을 ref 로 들고 있는다
    const sentinelRef = useRef(null)
    const loadMoreRef = useRef(loadMore)
    useEffect(() => {
        loadMoreRef.current = loadMore
    })
    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel) return undefined
        const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMoreRef.current(), {
            rootMargin: '200px',
        })
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasMore, moreFailed])

    return (
        <>
            <ul className="mate__items">
                {posts.map((post) => (
                    <li key={post.id}>
                        <MateCard
                            to={`/mate/${post.id}`}
                            image={post.imageUrl || MATE_POST.DEFAULT_IMAGE}
                            status={post.isOpen ? 'open' : 'closed'}
                            dday={formatDday(post.game.gameAt, now)}
                            title={post.title}
                            date={`${formatDay(post.game.gameAt)} ${formatTime(post.game.gameAt)} · ${matchLabel(post.game, myTeam)}`}
                            place={post.game.stadium}
                            tags={conditionTags(post)}
                            host={{
                                name: post.host.nickname,
                                avatar: post.host.avatarUrl ?? undefined,
                                manner: post.host.manner,
                            }}
                            joined={post.joinedCount}
                            capacity={post.capacity}
                        />
                    </li>
                ))}
            </ul>

            {/* 다음 쪽이 있을 때만 · 실패하면 감지를 멈추고 [다시 불러오기] */}
            {hasMore && !moreFailed && <div ref={sentinelRef} className="mate__sentinel" aria-hidden="true" />}
            {loadingMore && <p className="mate__more">더 불러오는 중…</p>}
            {moreFailed && (
                <Button variant="text" className="mate__more-retry" onClick={loadMore}>
                    글을 더 불러오지 못했어요 · 다시 불러오기
                </Button>
            )}
        </>
    )
}

export default Mate
