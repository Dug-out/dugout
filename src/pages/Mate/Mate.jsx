import {useEffect, useRef, useState} from 'react'
import {Link} from 'react-router'
import {Button, EmptyState, MateCard} from '../../components'
// Icon은 components/index.js 에서 내보내지 않아서 파일에서 직접 가져온다
import Icon from '../../components/Icon/Icon.jsx'
import {MATE_POST} from '../../constants/policy.js'
import MateCalendarSheet from './MateCalendarSheet.jsx'
import MateIcon from './MateIcon.jsx'
import {conditionTags, formatDay, formatDday, formatTime, matchLabel, teamName} from './mateFormat.js'
import {useMatePosts, useMyTeam} from './useMateData.js'
import './Mate.css'

/**
 * 메이트 찾기 · 모집 글 목록 (Mate.dc.html · Mate-date.dc.html · Empty-mate.dc.html)
 *
 * 화면 구성: [헤더: 제목 + 팀 배지 / 날짜 버튼 / 모집 중만 보기 · 정렬] [모집 글 카드 목록] [모집 글 쓰기 버튼]
 * 날짜 버튼을 누르면 달력 시트가 열린다 (MateCalendarSheet · Mate-cal.dc.html).
 *
 * 🔌 DB 연결: 이 화면은 useMateData.js 의 hook만 부르고, hook이 src/api/mate.js 함수를 부른다.
 */
function Mate() {
    // 내 응원팀 · 같은 팀 팬의 글만 보여 주기 위해 가장 먼저 필요하다
    const {team, failed: teamFailed} = useMyTeam()

    // 사용자가 고르는 조건 4가지
    const [date, setDate] = useState(null) // 고른 날짜 (null = 전체 날짜)
    const [dateGame, setDateGame] = useState(null) // 고른 날짜의 내 팀 경기 (날짜 버튼 "LG vs 두산" 문구용)
    const [openOnly, setOpenOnly] = useState(false) // 모집 중인 글만 보기
    const [sort, setSort] = useState('new') // new: 최신순 / old: 오래된순

    const [calendarOpen, setCalendarOpen] = useState(false) // 날짜 달력 시트 열림

    // 조건이 바뀔 때마다 첫 페이지부터 다시 불러온다 (team이 정해지기 전에는 기다린다)
    const posts = useMatePosts({team, date, openOnly, sort})

    // 무한 스크롤 · 목록 맨 아래에 둔 빈 칸(sentinel)이 화면에 들어오면 다음 페이지를 불러온다
    // IntersectionObserver: "이 요소가 화면에 보이는지" 브라우저가 알려 주는 기능 (스크롤 이벤트보다 가볍다)
    const sentinelRef = useRef(null)
    const {loadMore} = posts
    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel) return undefined
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadMore()
        }, {rootMargin: '200px'}) // 맨 아래 200px 전부터 미리 불러와서 기다리는 느낌을 줄인다
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [loadMore])

    // 달력 시트에서 "10.22 모집 글 보기"(날짜 + 그날 경기) 또는 "전체 날짜"(null, null)를 누르면
    const applyDate = (nextDate, game) => {
        setDate(nextDate)
        setDateGame(game)
        setCalendarOpen(false)
    }

    // 날짜 버튼 문구 · 디자인: '전체 날짜' / '10.22 (목) LG vs 두산' (경기 없는 날은 날짜만)
    const dateLabel = !date ? '전체 날짜' : dateGame ? `${formatDay(date)} ${matchLabel(dateGame, team)}` : formatDay(date)

    return (
        <>
            {/* 헤더 · 디자인이 다른 탭 화면(큰 제목 Header)과 달라서 공통 Header를 쓰지 않고 직접 그린다 */}
            <header className="mate-head">
                <div className="mate-head__top">
                    <h1 className="mate-head__title">메이트 찾기</h1>
                    {/* 팀을 불러오기 전에는 배지를 숨긴다 */}
                    {team && <span className="mate-head__team">{teamName(team)} 팬만 보여요</span>}
                </div>

                {/* 날짜 버튼 · 누르면 달력 시트 */}
                <button type="button" className="mate-head__date" onClick={() => setCalendarOpen(true)}
                        disabled={!team} aria-haspopup="dialog">
                    <Icon name="calendar" size={18}/>
                    <span className="mate-head__date-label">{dateLabel}</span>
                    <MateIcon name="chevronDown" size={16}/>
                </button>

                <div className="mate-head__row">
                    {/* 모집 중인 글만 보기 · 켜고 끄는 버튼이라 role="switch" + aria-checked */}
                    <button type="button" role="switch" aria-checked={openOnly} className="mate-head__open-only"
                            onClick={() => setOpenOnly((on) => !on)}>
                        <span className={`mate-head__check${openOnly ? ' mate-head__check--on' : ''}`}>
                            {openOnly && <Icon name="check" size={14} strokeWidth={3}/>}
                        </span>
                        모집 중인 글만 보기
                    </button>

                    {/* 정렬 · 둘 중 하나만 고르는 버튼이라 radiogroup + radio */}
                    <div role="radiogroup" aria-label="정렬" className="mate-head__sort">
                        {[['new', '최신순'], ['old', '오래된순']].map(([value, label]) => (
                            <button key={value} type="button" role="radio" aria-checked={sort === value}
                                    className="mate-head__sort-btn" onClick={() => setSort(value)}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 본문 · .mate-list 안에서만 모집 마감 카드를 흑백으로 바꾼다 (Mate.css) */}
            <main className="mate-list">
                <MateListBody team={team} teamFailed={teamFailed} posts={posts} sentinelRef={sentinelRef}/>

                {/* 모집 글 쓰기 · 빨간 알약 버튼 (CLAUDE.md: 글쓰기 버튼은 메이트 찾기 목록에만)
                    목록을 스크롤해도 탭바 바로 위에 떠 있도록 sticky (Mate.css) */}
                <div className="mate-list__fab-wrap">
                    <Link to="/mate/write" className="mate-list__fab">
                        <Icon name="plus" size={20} strokeWidth={2.2}/>
                        모집 글 쓰기
                    </Link>
                </div>
            </main>

            {/* 날짜 달력 시트 · 열 때마다 새로 만들어서 지금 고른 날짜로 시작한다 */}
            {calendarOpen && (
                <MateCalendarSheet team={team} initialDate={date} openOnly={openOnly}
                                   onApply={applyDate} onClose={() => setCalendarOpen(false)}/>
            )}
        </>
    )
}

/**
 * 목록 부분 · 상태에 따라 4가지 중 하나를 보여 준다
 *  불러오는 중 → 로딩 캐릭터 / 실패 → 다시 시도 / 글 없음 → 빈 화면(Empty-mate) / 글 있음 → 카드 목록
 */
function MateListBody({team, teamFailed, posts, sentinelRef}) {
    // 실패: 팀 정보 또는 첫 페이지를 못 불러왔을 때 (디자인 없음 → 빈 화면 틀을 따라 만들었다)
    if (teamFailed || posts.status === 'error') {
        return (
            <EmptyState className="mate-list__state" image="/assets/pose-sad.png"
                        title="모집 글을 불러오지 못했어요" description="잠시 후 다시 시도해 주세요"
                        action={!teamFailed && <Button variant="small-outline" onClick={posts.reload}>다시 시도</Button>}/>
        )
    }

    // 불러오는 중 (디자인 없음 → 로딩 캐릭터 loading.png + 빈 화면 틀)
    if (!team || posts.status === 'loading') {
        return (
            <EmptyState className="mate-list__state" image="/assets/loading.png" title="모집 글을 불러오고 있어요"/>
        )
    }

    // 글 없음 · 문구는 Empty-mate.dc.html 그대로
    if (posts.items.length === 0) {
        return (
            <EmptyState className="mate-list__state" title="조건에 맞는 모집 글이 없어요"
                        description="직접 글을 올려 같이 갈 메이트를 모아 보세요"/>
        )
    }

    return (
        <>
            {/* 카드 목록 · 기존 MateCard 컴포넌트를 그대로 쓴다 (MateCard.jsx는 수정하지 않음) */}
            <ul className="mate-list__items">
                {posts.items.map((post) => (
                    <li key={post.id}>
                        <MateCard
                            to={`/mate/${post.id}`} // 카드를 누르면 상세 화면
                            image={post.imageUrl || MATE_POST.DEFAULT_IMAGE} // 대표 이미지가 없으면 기본 이미지
                            status={post.isOpen ? 'open' : 'closed'} // 모집 중(빨강) / 모집 마감(회색)
                            dday={formatDday(post.game.gameAt)}
                            title={post.title}
                            // 디자인: '10.22 (목) 18:30 · LG vs 두산'
                            date={`${formatDay(post.game.gameAt)} ${formatTime(post.game.gameAt)} · ${matchLabel(post.game, team)}`}
                            place={post.game.stadium}
                            tags={conditionTags(post)} // [좌석] [나이대] [성별]
                            host={{name: post.host.nickname, avatar: post.host.avatarUrl ?? undefined, manner: post.host.manner}}
                            joined={post.joinedCount}
                            capacity={post.maxMembers}
                        />
                    </li>
                ))}
            </ul>

            {/* 무한 스크롤 감지용 빈 칸 · 다음 페이지가 있을 때만 둔다 */}
            {posts.hasMore && !posts.moreFailed && <div ref={sentinelRef} className="mate-list__sentinel" aria-hidden="true"/>}
            {posts.moreLoading && <p className="mate-list__more">더 불러오는 중…</p>}
            {posts.moreFailed && (
                <Button variant="text" className="mate-list__more-retry" onClick={posts.loadMore}>
                    글을 더 불러오지 못했어요 · 다시 불러오기
                </Button>
            )}
        </>
    )
}

export default Mate
