import {useState} from 'react'
import {Link, useSearchParams} from 'react-router'
import {Button, EmptyState, Header, Icon, LoadState} from '../../components'
import {MATE_POST} from '../../constants/policy.js'
import useMyPosts from '../../hooks/load/useMyPosts.js'
import useMyTeam from '../../hooks/load/useMyTeam.js'
import {formatDay, formatDday, formatTime, matchLabel} from '../../utils/mateFormat.js'
import './Record.css'

// 상단 보기 구분 · 약속(다가오는·지난 직관 약속) · 기록(직관 기록) · 통계(상대팀별 승률)
const TOP_TABS = [
    {key: 'posts', label: '약속'},
    {key: 'list', label: '기록'},
    {key: 'stats', label: '통계'},
]

/** 내 직관 · 약속(마이페이지의 "내 직관 약속"과 같은 화면) · 기록 · 통계를 한 화면에서 본다 */
function Record() {
    const [params, setParams] = useSearchParams()
    const tabKey = TOP_TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'posts'
    const setTabKey = (key) => setParams(key === 'posts' ? {} : {tab: key}, {replace: true})

    return (
        <div className="record">
            <Header large title="내 직관" />
            <div className="record__tabs" role="tablist" aria-label="내 직관 보기">
                {TOP_TABS.map(({key, label}) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={key === tabKey}
                        className="record__tab"
                        onClick={() => setTabKey(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tabKey === 'posts' && <PostsSection />}
            {tabKey === 'list' && (
                <EmptyState
                    title="아직 직관 기록이 없어요"
                    description={
                        <>
                            첫 직관을 기록하고
                            <br />
                            나만의 직관 승률을 만들어 보세요
                        </>
                    }
                />
            )}
            {tabKey === 'stats' && (
                <EmptyState
                    title="아직 통계를 보여드릴 수 없어요"
                    description={
                        <>
                            직관 기록을 쌓으면
                            <br />
                            상대팀별 승률을 볼 수 있어요
                        </>
                    }
                />
            )}
        </div>
    )
}

/** "약속" 탭 · 다가오는 직관 약속과 지난 직관 약속 */
function PostsSection() {
    // status 는 loading | ready | error
    const {status, data, reload} = useMyPosts()

    return (
        <>
            <LoadState status={status} errorTitle="약속을 불러오지 못했어요" onRetry={reload} />
            {status === 'ready' && data.length === 0 && (
                <EmptyState
                    title="아직 잡힌 직관 약속이 없어요"
                    description={
                        <>
                            모집 글에 참여하거나
                            <br />
                            직접 글을 올려 메이트를 모아 보세요
                        </>
                    }
                    action={
                        <Button as={Link} to="/home">
                            메이트 찾으러 가기
                        </Button>
                    }
                />
            )}
            {status === 'ready' && data.length > 0 && <PostList items={data} />}
        </>
    )
}

// 보기 구분 · 내가 연 약속은 방장, 참여한 약속은 방장이 아닌 약속
const POST_FILTERS = [
    {key: 'all', label: '전체', match: () => true},
    {key: 'host', label: '내가 연 약속', match: (item) => item.role === 'host'},
    {key: 'joined', label: '참여한 약속', match: (item) => item.role !== 'host'},
]

/** 필터와 다가오는 직관 · 지난 직관 목록 */
function PostList({items}) {
    // 내 응원팀 · 경기 이름을 내 팀 먼저 쓸 때 쓴다
    const myTeam = useMyTeam()
    // 고른 구분
    const [filterKey, setFilterKey] = useState('all')

    const filter = POST_FILTERS.find((f) => f.key === filterKey)
    const shown = items.filter(filter.match)

    // 화면이 뜬 시각 · 렌더링마다 바뀌지 않도록 한 번만 정한다
    const [now] = useState(() => Date.now())
    // 경기 시각이 지났으면 지난 직관 · 다가오는 직관은 가까운 순, 지난 직관은 최근 순
    const byTime = (a, b) => new Date(a.game.gameAt) - new Date(b.game.gameAt)
    const upcoming = shown.filter((i) => new Date(i.game.gameAt) > now).sort(byTime)
    const past = shown.filter((i) => new Date(i.game.gameAt) <= now).sort((a, b) => byTime(b, a))

    return (
        <main className="record__posts-body">
            <div className="record__posts-tabs" role="tablist" aria-label="내 직관 약속 보기">
                {POST_FILTERS.map(({key, label, match}) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={key === filterKey}
                        className="record__posts-tab"
                        onClick={() => setFilterKey(key)}
                    >
                        {label} {items.filter(match).length}
                    </button>
                ))}
            </div>

            {upcoming.length > 0 && (
                <section className="record__posts-group">
                    <h2 className="record__posts-heading">다가오는 직관</h2>
                    {upcoming.map((item) => (
                        <PostCard key={item.id} item={item} myTeam={myTeam} now={now} />
                    ))}
                </section>
            )}
            {past.length > 0 && (
                <section className="record__posts-group">
                    <h2 className="record__posts-heading">지난 직관</h2>
                    {past.map((item) => (
                        <PostCard key={item.id} item={item} myTeam={myTeam} now={now} past />
                    ))}
                </section>
            )}
        </main>
    )
}

/** 약속 한 장 · 위에 사진(상태 뱃지, D-day), 아래에 제목과 경기 일정·구장·인원. 방장이고 대기 중인 신청이 있으면 맨 아래에 안내 줄이 붙는다 */
function PostCard({item, myTeam, now, past = false}) {
    const {id, title, image, role, capacity, joinedCount, hostNickname, pendingCount, game} = item

    // 사진 위 상태 뱃지 · 지난 약속은 종료, 아니면 내가 방장인지 참여 중인지
    const badge = past
        ? {text: '종료', tone: 'ended'}
        : role === 'host'
          ? {text: '방장', tone: 'host'}
          : {text: '참여 중', tone: 'joined'}

    return (
        <article className="record__posts-card">
            {/* 지금은 모집 글 상세로 이동 · 채팅방, 기록 상세가 생기면 상태에 따라 나눠 연결한다 */}
            <Link to={`/mate/${id}`} className={`record__posts-link${past ? ' record__posts-link--past' : ''}`}>
                <span className="record__posts-cover">
                    <img src={image ?? MATE_POST.DEFAULT_IMAGE} alt="" width="350" height="120" />
                    <span className={`record__posts-badge record__posts-badge--${badge.tone}`}>{badge.text}</span>
                    {!past && <span className="record__posts-dday">{formatDday(game.gameAt, now)}</span>}
                </span>
                <span className="record__posts-text">
                    <span className="record__posts-title">{title}</span>
                    <span className="record__posts-lines">
                        <span className="record__posts-line record__posts-line--main">
                            <Icon name="calendar" size={14} />
                            {formatDay(game.gameAt)} {formatTime(game.gameAt)} · {matchLabel(game, myTeam)}
                        </span>
                        <span className="record__posts-line">
                            <Icon name="pin" size={14} />
                            {game.stadium}
                        </span>
                        <span className="record__posts-line">
                            <Icon name="mate" size={14} />
                            방장 {hostNickname} · {joinedCount}/{capacity}명
                        </span>
                    </span>
                </span>
            </Link>

            {/* 새 신청 안내 · 아직 안 지난 약속의 방장에게만 */}
            {!past && role === 'host' && pendingCount > 0 && (
                <Link to={`/mate/${id}/manage`} className="record__posts-banner">
                    <span className="record__posts-banner-count">{pendingCount}</span>
                    <span className="record__posts-banner-text">새 참여 신청이 기다리고 있어요</span>
                    신청자 관리
                    <Icon name="chevronRight" size={16} />
                </Link>
            )}
        </article>
    )
}

export default Record
