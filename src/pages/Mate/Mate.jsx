import {useState} from 'react'
import {Link} from 'react-router'
import {EmptyState, Icon, MateCard} from '../../components'
import {MATE_POST, SIGNUP} from '../../constants/policy.js'
import {formatDay, formatDday, formatTime, matchLabel} from '../../utils/mateFormat.js'
import MateDateSheet from './components/MateDateSheet.jsx'
import './Mate.css'

// [화면 틀] 고정 글자 · 기능을 붙일 때 내 팀은 useMyTeam, 글은 useMatePostList, 경기 날은 useSelectableGames 로 바꾼다
const SAMPLE_TEAM = 'LG'

// 오늘부터 며칠 뒤 그 시각 · 언제 열어도 앞으로 열릴 경기로 보이게
const daysLater = (days, hour, minute) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    date.setHours(hour, minute, 0, 0)
    return date.toISOString()
}

// getMatePosts 가 돌려주는 글과 같은 모양
const SAMPLE_POSTS = [
    {
        id: 'sample-1',
        title: '모집 글 제목 들어갈곳 1',
        imageUrl: null,
        isOpen: true,
        seat: '응원석',
        ages: ['20대', '30대'],
        gender: '무관',
        capacity: 4,
        joinedCount: 2,
        createdAt: 3,
        host: {id: 'host-1', nickname: '닉네임 들어갈곳 1', avatarUrl: null, manner: 0.389},
        game: {gameAt: daysLater(1, 18, 30), home: 'LG', away: '두산', stadium: '구장 이름 들어갈곳'},
    },
    {
        id: 'sample-2',
        title: '모집 글 제목 들어갈곳 2',
        imageUrl: null,
        isOpen: true,
        seat: '테이블석',
        ages: [],
        gender: '여성',
        capacity: 2,
        joinedCount: 1,
        createdAt: 2,
        host: {id: 'host-2', nickname: '닉네임 들어갈곳 2', avatarUrl: null, manner: 0.341},
        game: {gameAt: daysLater(1, 18, 30), home: 'LG', away: '두산', stadium: '구장 이름 들어갈곳'},
    },
    {
        id: 'sample-3',
        title: '모집 글 제목 들어갈곳 3 (모집 마감)',
        imageUrl: null,
        isOpen: false,
        seat: '외야석',
        ages: ['20대'],
        gender: '무관',
        capacity: 3,
        joinedCount: 3,
        createdAt: 1,
        host: {id: 'host-3', nickname: '닉네임 들어갈곳 3', avatarUrl: null, manner: 0.312},
        game: {gameAt: daysLater(4, 14, 0), home: 'KT', away: 'LG', stadium: '구장 이름 들어갈곳'},
    },
]

// 같은 날인지 (시각은 보지 않는다)
const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

// 카드 조건 태그 · [좌석] [나이대] [성별]
const conditionTags = ({seat, ages, gender}) => [
    seat,
    ages.length ? ages.join('·') : '나이 무관',
    gender === '무관' ? '성별 무관' : `${gender}만`,
]

/** 메이트 찾기 · 같은 팀 팬의 모집 글 목록 (날짜 · 모집 중만 · 정렬) */
function Mate() {
    const myTeam = SAMPLE_TEAM
    const teamName = SIGNUP.TEAMS.find((team) => team.code === myTeam)?.name ?? myTeam

    // 고른 날짜 (null 이면 전체) / 그날 내 팀 경기 (날짜 버튼 문구용)
    const [date, setDate] = useState(null)
    const [dateGame, setDateGame] = useState(null)
    // 모집 중인 글만 보기 / 정렬 · new 최신순, old 오래된순
    const [openOnly, setOpenOnly] = useState(false)
    const [sort, setSort] = useState('new')
    // 날짜 달력 시트가 열려 있는지
    const [dateSheetOpen, setDateSheetOpen] = useState(false)

    // 화면이 뜬 시각 · D-day 를 셀 때 쓴다
    const [now] = useState(() => Date.now())

    // [화면 틀] 고정 글을 화면에서 거르고 정렬한다 · 기능을 붙이면 DB 가 맡는다
    const posts = SAMPLE_POSTS.filter((post) => !date || isSameDay(post.game.gameAt, date))
        .filter((post) => !openOnly || post.isOpen)
        .sort((a, b) => (sort === 'new' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt))

    // [화면 틀] 경기가 있는 날 · 달력 빨간 점
    const games = SAMPLE_POSTS.map((post) => post.game)

    // 달력에서 날짜를 고르거나(날짜, 경기) [전체 날짜]를 눌렀을 때(null, null)
    const applyDate = (nextDate, game) => {
        setDate(nextDate)
        setDateGame(game)
        setDateSheetOpen(false)
    }

    // 날짜 버튼 문구 · '전체 날짜' / '10.22 (목) LG vs 두산' (경기 없는 날은 날짜만)
    const dateLabel = !date ? '전체 날짜' : `${formatDay(date)}${dateGame ? ` ${matchLabel(dateGame, myTeam)}` : ''}`

    return (
        <div className="mate">
            <header className="mate__head">
                <div className="mate__head-top">
                    <h1 className="mate__title">메이트 찾기</h1>
                    <span className="mate__team">{teamName} 팬만 보여요</span>
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
                {posts.length === 0 ? (
                    <EmptyState
                        className="mate__empty"
                        image="/assets/empty-sleep.png"
                        title="조건에 맞는 모집 글이 없어요"
                        description="직접 글을 올려 같이 갈 메이트를 모아 보세요"
                    />
                ) : (
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
                )}

                {/* 모집 글 쓰기 · 탭바 위에 떠 있는 빨간 알약 버튼 (메이트 찾기 목록에만) */}
                <div className="mate__fab-wrap">
                    <Link to="/mate/write" className="mate__fab">
                        <Icon name="plus" size={20} strokeWidth={2.2} />
                        모집 글 쓰기
                    </Link>
                </div>
            </main>

            {/* 날짜 달력 시트 · 열 때마다 지금 고른 날짜로 시작한다 */}
            {dateSheetOpen && (
                <MateDateSheet
                    myTeam={myTeam}
                    games={games}
                    posts={SAMPLE_POSTS}
                    openOnly={openOnly}
                    initialDate={date}
                    onApply={applyDate}
                    onClose={() => setDateSheetOpen(false)}
                />
            )}
        </div>
    )
}

export default Mate
