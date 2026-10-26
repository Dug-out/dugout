import {useEffect, useMemo, useState} from 'react'
import {useLocation, useNavigate} from 'react-router'
import {addMinutes, buildReasons, fetchUpcomingGames, matchChecklist, matchPercent, rankGames, savePlan, stadiumFood} from '../../api/planner.js'
import {fetchMyProfile} from '../../api/profile.js'
import {Button, Header} from '../../components'
import Icon from '../../components/Icon/Icon.jsx'
import {DEFAULT_CONDITIONS} from '../../constants/planner.js'
import {MOCK_MATE_POSTS} from '../../constants/mate.js'
import {SIGNUP} from '../../constants/policy.js'
import './AiPlan.css'

const teamName = (code) => SIGNUP.TEAMS.find((t) => t.code === code)?.name ?? code
const won = (n) => `${n.toLocaleString('ko-KR')}원`
// 실제 예매처 딥링크는 팀마다 달라서 함부로 추측하지 않는다 — 검색 결과로 보낸다.
const ticketSearchUrl = (label) => `https://search.naver.com/search.naver?query=${encodeURIComponent(`${label} 티켓 예매`)}`

/** "메이트 구해요"를 고르면 이 경기 모집 글을 더 위로, 아니면 하단에 */
function MateSection({mates}) {
    return (
        <section>
            <div className="home__section-head">
                <h3>이 경기 같이 갈 메이트</h3>
                <span className="aiplan__count">모집글 {mates.length}개</span>
            </div>
            {mates.length === 0 && <p className="aiplan__empty-mate">이 날짜엔 아직 모집 글이 없어요</p>}
            <ul className="mate-row-list">
                {mates.map((m) => (
                    <li key={m.id} className="mate-row">
                        <img src="/assets/profile-default.png" alt="" width="36" height="36"/>
                        <span className="mate-row__body">
                            <strong>{m.title}</strong>
                            <em>{m.host} · {m.place} · {m.joined}/{m.capacity}</em>
                        </span>
                        <span className="mate-row__match">취향 {m.matchPct}%</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

/** AI 직관 플랜 · 조건에 맞춰 더미 경기 데이터를 규칙 기반으로 추천한다 (LLM 연결 전 테스트용) */
function AiPlan() {
    const navigate = useNavigate()
    const {state} = useLocation()
    const conditions = state?.conditions ?? DEFAULT_CONDITIONS

    const [profile, setProfile] = useState(null)
    const [games, setGames] = useState(null)
    const [error, setError] = useState('')
    const [selectedId, setSelectedId] = useState(null)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetchMyProfile().then(setProfile).catch((e) => setError(e.message))
    }, [])

    useEffect(() => {
        if (!profile) return
        fetchUpcomingGames(profile.team)
            .then(setGames)
            .catch((e) => setError('더미 데이터를 불러오지 못했어요. supabase/schema_ai_planner.sql을 Supabase에 먼저 실행해 주세요.\n' + e.message))
    }, [profile])

    const ranked = useMemo(() => {
        if (!games || !profile) return []
        return rankGames(games, conditions).slice(0, 3)
    }, [games, profile, conditions])

    const selected = ranked.find((r) => r.game.id === selectedId) ?? ranked[0]

    if (error) {
        return (
            <div className="aiplan">
                <Header title="AI 직관 플랜" backTo="/home"/>
                <p className="aiplan__error">{error}</p>
            </div>
        )
    }

    if (!profile || !games) {
        return (
            <div className="aiplan">
                <Header title="AI 직관 플랜" backTo="/home"/>
                <p className="aiplan__loading">불러오는 중…</p>
            </div>
        )
    }

    if (ranked.length === 0) {
        return (
            <div className="aiplan">
                <Header title="AI 직관 플랜" backTo="/home"/>
                <p className="aiplan__loading">추천할 수 있는 경기가 없어요. 더미 경기 데이터를 확인해 주세요.</p>
            </div>
        )
    }

    const {game, seat} = selected
    const stadium = game.stadiums
    const mates = MOCK_MATE_POSTS.filter((p) => p.gameDate === game.game_date)
    const checklist = matchChecklist(game, seat, conditions, mates.length)
    const match = matchPercent(checklist)
    const reasons = buildReasons({game, seat, conditions})
    const food = stadiumFood(game.stadium_code, conditions.food)
    const wantsMate = conditions.with === '메이트 구해요'

    const handleSave = async () => {
        try {
            await savePlan({
                userId: profile.id,
                gameId: game.id,
                companionType: conditions.with,
                seatZone: seat?.zone ?? '미정',
                budgetTier: conditions.budget,
            })
            setSaved(true)
        } catch (e) {
            setError(e.message)
        }
    }

    const handleCreateMeetup = () => {
        navigate('/mate/write', {
            state: {
                gameId: game.id,
                date: `${game.game_date.slice(5).replace('-', '.')}(${game.start_time.slice(0, 5)})`,
                seat: seat?.zone,
                budget: conditions.budget,
            },
        })
    }

    return (
        <div className="aiplan">
            <Header title="AI 직관 플랜" backTo="/home" right={
                <button type="button" className="aiplan__edit" onClick={() => navigate('/home')}>조건 수정</button>
            }/>

            <main className="aiplan__main">
                <div className="cond-summary">
                    <span className="cond-summary__team">{teamName(profile.team)}</span>
                    <span className="cond-summary__tag">{conditions.when}</span>
                    <span className="cond-summary__tag">{conditions.with}</span>
                    <span className="cond-summary__tag">{conditions.seat}</span>
                    <span className="cond-summary__tag">{conditions.budget}</span>
                    <span className="cond-summary__tag">{conditions.food}</span>
                </div>

                <h3 className="aiplan__h3">이번 주 추천 경기</h3>
                <div className="rank-grid">
                    {ranked.map((r, i) => (
                        <button key={r.game.id} type="button"
                                className={`rank-tile ${r.game.id === selected.game.id ? 'rank-tile--selected' : ''}`}
                                onClick={() => setSelectedId(r.game.id)}>
                            <span className="rank-tile__label">{i + 1}순위</span>
                            <span className="rank-tile__date">{r.game.game_date.slice(5).replace('-', '.')}</span>
                            <span className="rank-tile__vs">vs {teamName(r.game.home_team === profile.team ? r.game.away_team : r.game.home_team)}</span>
                            <span className="rank-tile__score">추천 {r.score}</span>
                        </button>
                    ))}
                </div>

                <section className="game-card">
                    <div className="game-card__top">
                        <span>{game.game_date.slice(5).replace('-', '.')}({'일월화수목금토'[new Date(`${game.game_date}T00:00:00`).getDay()]}) {game.start_time?.slice(0, 5)} · {stadium?.name}</span>
                        <span className="game-card__match">플랜 조건 {match}% 일치</span>
                    </div>

                    <p className="game-card__vs">{teamName(game.home_team)} vs {teamName(game.away_team)}</p>

                    <div className="game-card__checklist">
                        <span className={`cond-check ${checklist.when ? 'cond-check--hit' : ''}`}>{checklist.when ? '✓' : '✕'} {conditions.when}</span>
                        <span className={`cond-check ${checklist.with ? 'cond-check--hit' : ''}`}>{checklist.with ? '✓' : '✕'} {conditions.with}</span>
                        <span className={`cond-check ${checklist.seat ? 'cond-check--hit' : ''}`}>{checklist.seat ? '✓' : '✕'} {conditions.seat}</span>
                        <span className={`cond-check ${checklist.budget ? 'cond-check--hit' : ''}`}>{checklist.budget ? '✓' : '✕'} {conditions.budget}</span>
                        <span className={`cond-check ${checklist.food ? 'cond-check--hit' : ''}`}>{checklist.food ? '✓' : '✕'} {conditions.food}</span>
                    </div>

                    <div className="game-card__weather">
                        <Icon name="cloud" size={16}/>
                        <span>{game.weather_desc} {game.weather_temp}° · 강수확률 {game.rain_chance}%</span>
                    </div>
                </section>

                {wantsMate && <MateSection mates={mates}/>}

                <section className="reason-card">
                    <h3 className="aiplan__h3 aiplan__h3--sparkle"><Icon name="sparkle" size={15}/> 이 경기를 추천한 이유</h3>
                    <ul>
                        {reasons.map((r) => (
                            <li key={r}><Icon name="check" size={15}/><span>{r}</span></li>
                        ))}
                    </ul>
                </section>

                <div className="info-grid">
                    <div className="info-tile">
                        <span className="info-tile__label"><Icon name="cloud" size={16}/>날씨</span>
                        <span className="info-tile__value">{game.weather_desc} {game.weather_temp}°</span>
                        <span className="info-tile__sub">강수확률 {game.rain_chance}%</span>
                    </div>
                    <div className="info-tile">
                        <span className="info-tile__label"><Icon name="pin" size={16}/>추천 좌석</span>
                        <span className="info-tile__value">{seat?.zone ?? '잔여석 없음'}</span>
                        <span className="info-tile__sub">{seat?.note ?? '구역 기준 추천'}</span>
                        {seat && (
                            <a className="info-tile__link" href={ticketSearchUrl(teamName(profile.team))} target="_blank" rel="noreferrer">
                                좌석 확인하기 ›
                            </a>
                        )}
                    </div>
                    <div className="info-tile">
                        <span className="info-tile__label"><Icon name="won" size={16}/>예상 비용 (1인)</span>
                        <span className="info-tile__value">{seat ? won(seat.price) : '-'}</span>
                        <span className="info-tile__sub">티켓 + 먹거리 기준</span>
                    </div>
                    <div className="info-tile">
                        <span className="info-tile__label"><Icon name="train" size={16}/>가는 길</span>
                        <span className="info-tile__value">지하철 약 {stadium?.transit_minutes}분</span>
                        <span className="info-tile__sub">{stadium?.transit_line}</span>
                    </div>
                </div>

                <h3 className="aiplan__h3">구장 맛집 · 카페</h3>
                {food.length === 0 && <p className="aiplan__empty-mate">이 구장의 맛집 정보가 아직 없어요</p>}
                <ul className="food-list">
                    {food.map((f) => (
                        <li key={f.name} className="food-row">
                            <span className="food-row__cat">{f.category}</span>
                            <span className="food-row__body">
                                <strong>{f.name}</strong>
                                <em>도보 {f.walk_min}분 · {f.price}</em>
                            </span>
                            <span className="food-row__rating">★ {f.rating}</span>
                        </li>
                    ))}
                </ul>

                <h3 className="aiplan__h3">직관 타임라인</h3>
                <ul className="timeline">
                    <li><span className="timeline__time">{addMinutes(game.start_time, -60)}</span><span className="timeline__dot"/><span className="timeline__body"><strong>{stadium?.name} 도착</strong><em>게이트 혼잡 전 입장 추천</em></span></li>
                    <li><span className="timeline__time">{addMinutes(game.start_time, -45)}</span><span className="timeline__dot"/><span className="timeline__body"><strong>먹거리 픽업</strong><em>{food[0] ? `${food[0].name} 추천` : '구장 먹거리 추천 보기'}</em></span></li>
                    <li><span className="timeline__time">{game.start_time?.slice(0, 5)}</span><span className="timeline__dot timeline__dot--red"/><span className="timeline__body"><strong>플레이볼</strong><em>{seat ? `${seat.zone} 응원 시작` : '경기 시작'}</em></span></li>
                    <li><span className="timeline__time">{addMinutes(game.start_time, 190)}</span><span className="timeline__dot"/><span className="timeline__body"><strong>경기 종료 예상</strong><em>막차까지 여유 있어요</em></span></li>
                </ul>

                {!wantsMate && <MateSection mates={mates}/>}
            </main>

            <div className="aiplan__bottom">
                <div className="aiplan__autofill">
                    <span>모임 글에 자동으로 채워져요</span>
                    <div className="aiplan__autofill-chips">
                        <span>{game.game_date.slice(5).replace('-', '.')}({game.start_time?.slice(0, 5)})</span>
                        <span>{seat?.zone ?? '좌석 미정'}</span>
                        <span>1인 {conditions.budget === '상관없음' ? '예산 무관' : conditions.budget}</span>
                    </div>
                </div>
                <div className="aiplan__actions">
                    <Button variant="secondary" onClick={handleSave} disabled={saved}>
                        <Icon name="bookmark" size={16}/> {saved ? '저장됨' : '플랜 저장'}
                    </Button>
                    <Button variant="primary" className="aiplan__make" onClick={handleCreateMeetup}>
                        <Icon name="plus" size={16}/> 이 일정으로 모임 만들기
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default AiPlan
