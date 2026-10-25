import {useState} from 'react'
import {Link} from 'react-router'
import {Button, EmptyState, Header, Icon, LoadState} from '../../components'
import {MATE_POST} from '../../constants/policy.js'
import useMyPosts from '../../hooks/load/useMyPosts.js'
import useMyTeam from '../../hooks/load/useMyTeam.js'
import {formatDay, formatDday, formatTime, matchLabel} from '../../utils/mateFormat.js'
import './MyPosts.css'

// 보기 구분 · 내가 연 약속은 방장, 참여한 약속은 방장이 아닌 약속
const TABS = [
    {key: 'all', label: '전체', match: () => true},
    {key: 'host', label: '내가 연 약속', match: (item) => item.role === 'host'},
    {key: 'joined', label: '참여한 약속', match: (item) => item.role !== 'host'},
]

/** 내 직관 약속 · 약속이 없으면 빈 화면을 보여 준다 */
function MyPosts() {
    // status 는 loading | ready | error
    const {status, data, reload} = useMyPosts()

    return (
        <div className="my-posts">
            <Header title="내 직관 약속" backTo="/my" />
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
        </div>
    )
}

/** 탭과 다가오는 직관 · 지난 직관 목록 */
function PostList({items}) {
    // 내 응원팀 · 경기 이름을 내 팀 먼저 쓸 때 쓴다
    const myTeam = useMyTeam()
    // 고른 구분
    const [tabKey, setTabKey] = useState('all')

    const tab = TABS.find((t) => t.key === tabKey)
    const shown = items.filter(tab.match)

    // 화면이 뜬 시각 · 렌더링마다 바뀌지 않도록 한 번만 정한다
    const [now] = useState(() => Date.now())
    // 경기 시각이 지났으면 지난 직관 · 다가오는 직관은 가까운 순, 지난 직관은 최근 순
    const byTime = (a, b) => new Date(a.game.gameAt) - new Date(b.game.gameAt)
    const upcoming = shown.filter((i) => new Date(i.game.gameAt) > now).sort(byTime)
    const past = shown.filter((i) => new Date(i.game.gameAt) <= now).sort((a, b) => byTime(b, a))

    return (
        <main className="my-posts__body">
            <div className="my-posts__tabs" role="tablist" aria-label="내 직관 약속 보기">
                {TABS.map(({key, label, match}) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={key === tabKey}
                        className="my-posts__tab"
                        onClick={() => setTabKey(key)}
                    >
                        {label} {items.filter(match).length}
                    </button>
                ))}
            </div>

            {upcoming.length > 0 && (
                <section className="my-posts__group">
                    <h2 className="my-posts__heading">다가오는 직관</h2>
                    {upcoming.map((item) => (
                        <PostCard key={item.id} item={item} myTeam={myTeam} now={now} />
                    ))}
                </section>
            )}
            {past.length > 0 && (
                <section className="my-posts__group">
                    <h2 className="my-posts__heading">지난 직관</h2>
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
        <article className="my-posts__card">
            {/* 지금은 모집 글 상세로 이동 · 채팅방, 기록 상세가 생기면 상태에 따라 나눠 연결한다 */}
            <Link to={`/mate/${id}`} className={`my-posts__link${past ? ' my-posts__link--past' : ''}`}>
                <span className="my-posts__cover">
                    <img src={image ?? MATE_POST.DEFAULT_IMAGE} alt="" width="350" height="120" />
                    <span className={`my-posts__badge my-posts__badge--${badge.tone}`}>{badge.text}</span>
                    {!past && <span className="my-posts__dday">{formatDday(game.gameAt, now)}</span>}
                </span>
                <span className="my-posts__text">
                    <span className="my-posts__title">{title}</span>
                    <span className="my-posts__lines">
                        <span className="my-posts__line my-posts__line--main">
                            <Icon name="calendar" size={14} />
                            {formatDay(game.gameAt)} {formatTime(game.gameAt)} · {matchLabel(game, myTeam)}
                        </span>
                        <span className="my-posts__line">
                            <Icon name="pin" size={14} />
                            {game.stadium}
                        </span>
                        <span className="my-posts__line">
                            <Icon name="mate" size={14} />
                            방장 {hostNickname} · {joinedCount}/{capacity}명
                        </span>
                    </span>
                </span>
            </Link>

            {/* 새 신청 안내 · 아직 안 지난 약속의 방장에게만 */}
            {!past && role === 'host' && pendingCount > 0 && (
                <Link to={`/mate/${id}/manage`} className="my-posts__banner">
                    <span className="my-posts__banner-count">{pendingCount}</span>
                    <span className="my-posts__banner-text">새 참여 신청이 기다리고 있어요</span>
                    신청자 관리
                    <Icon name="chevronRight" size={16} />
                </Link>
            )}
        </article>
    )
}

export default MyPosts
