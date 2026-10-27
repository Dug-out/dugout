import {useEffect, useMemo, useState} from 'react'
import {useLocation, useNavigate} from 'react-router'
import {addMinutes, buildReasons, fetchUpcomingGames, matchChecklist, matchPercent, rankGames, sortFoodByPreferred, sortIndoorFoodBySeat} from '../../api/planner.js'
import {fetchMyProfile} from '../../api/profile.js'
import {fetchGameWeather} from '../../api/weather.js'
import {fetchIndoorStadiumFood, fetchNearbyStadiumFood} from '../../api/stadiumFood.js'
import {fetchAiReasons} from '../../api/aiReasons.js'
import {Button, Header} from '../../components'
import Icon from '../../components/Icon/Icon.jsx'
import {DEFAULT_CONDITIONS} from '../../constants/planner.js'
import {MOCK_MATE_POSTS} from '../../constants/mate.js'
import {SIGNUP} from '../../constants/policy.js'
import './AiPlan.css'

const teamName = (code) => SIGNUP.TEAMS.find((t) => t.code === code)?.name ?? code
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

/** AI 직관 플랜 · 경기 추천 순위는 규칙 기반(scoreGame), "추천 이유" 문장은 Gemini(plan-recommend)가 생성 */
function AiPlan() {
    const navigate = useNavigate()
    const {state} = useLocation()
    const conditions = state?.conditions ?? DEFAULT_CONDITIONS

    const [profile, setProfile] = useState(null)
    const [games, setGames] = useState(null)
    const [error, setError] = useState('')
    const [selectedId, setSelectedId] = useState(null)
    const [liveWeather, setLiveWeather] = useState(null)
    const [indoorFood, setIndoorFood] = useState(null)
    const [nearbyFood, setNearbyFood] = useState(null)
    const [aiReasons, setAiReasons] = useState(null)

    useEffect(() => {
        fetchMyProfile().then(setProfile).catch((e) => setError(e.message))
    }, [])

    useEffect(() => {
        if (!profile) return
        fetchUpcomingGames()
            .then(setGames)
            .catch((e) => setError('경기 일정을 불러오지 못했어요.\n' + e.message))
    }, [profile])

    const ranked = useMemo(() => {
        if (!games || !profile) return []
        return rankGames(games, conditions).slice(0, 3)
    }, [games, profile, conditions])

    const selected = ranked.find((r) => r.game.id === selectedId) ?? ranked[0]

    // 구장 정보가 있으면 Open-Meteo(날씨·대기질) · stadium_food 테이블(구장 내 맛집, DB) ·
    // 카카오 로컬 API(구장 주변 맛집)를 같이 받아오고, 그 결과를 바탕으로 Gemini(plan-recommend)에게
    // "추천 이유" 문장을 만들어 달라고 한다.
    useEffect(() => {
        let alive = true
        const game = selected?.game
        const stadium = game?.stadiums

        const task = !game || !stadium
            ? Promise.resolve([null, [], null])
            : Promise.all([
                fetchGameWeather({lat: stadium.lat, lng: stadium.lng, date: game.game_date, startTime: game.start_time}).catch((e) => {
                    console.error(e)
                    return null
                }),
                fetchIndoorStadiumFood(game.stadium_code).catch((e) => {
                    console.error(e)
                    return []
                }),
                fetchNearbyStadiumFood({lat: stadium.lat, lng: stadium.lng, stadiumCode: game.stadium_code}).catch((e) => {
                    console.error(e)
                    return null
                }),
            ])

        task.then(([weather, indoor, nearbyRaw]) => {
            if (!alive) return null
            setLiveWeather(weather)
            setIndoorFood(indoor)
            // "구장 내" 목록과 겹치는 이름은 Edge Function이 서버에서 이미 빼고 내려준다.
            setNearbyFood(nearbyRaw)
            if (!game) return null

            const topFood = sortIndoorFoodBySeat(indoor ?? [], conditions.seat, conditions.food)[0]
                ?? sortFoodByPreferred(nearbyRaw ?? [], conditions.food)[0]
            const opponent = game.home_team === profile.team ? game.away_team : game.home_team
            return fetchAiReasons({
                teamName: teamName(profile.team),
                game: {
                    date: game.game_date,
                    startTime: game.start_time,
                    stadiumName: stadium.name,
                    opponentName: teamName(opponent),
                    isHome: game.home_team === profile.team,
                },
                conditions: {when: conditions.when, with: conditions.with, seat: conditions.seat, food: conditions.food},
                weather: weather ? {desc: weather.weather_desc, temp: weather.weather_temp, rainChance: weather.rain_chance, airGrade: weather.air_grade} : null,
                // 구장 내 항목은 location("3루 3층"), 구장 주변 항목은 walkMin(도보 분)을 쓴다 — 둘 다 있을 리 없다.
                foodSpot: topFood ? {name: topFood.name, category: topFood.category, location: topFood.location ?? null, walkMin: topFood.walk_min ?? null} : null,
            }).catch((e) => {
                console.error(e)
                return null
            })
        }).then((reasons) => { if (alive) setAiReasons(reasons) })

        return () => { alive = false }
    }, [selected, profile?.team, conditions.when, conditions.with, conditions.seat, conditions.food])

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
                <p className="aiplan__loading">곧 열리는 우리 팀 경기가 아직 없어요. 경기 일정이 나오면 다시 확인해 주세요.</p>
            </div>
        )
    }

    const {game} = selected
    const stadium = game.stadiums
    // liveWeather가 있으면(Open-Meteo 조회 성공) 더미 weather_desc·weather_temp·rain_chance를 실제 값으로 덮어쓴다.
    const displayGame = liveWeather ? {...game, ...liveWeather} : game
    const mates = MOCK_MATE_POSTS.filter((p) => p.gameDate === game.game_date)
    // 구장 내는 좌석 조건과 같은 방향(내야/외야)부터, 구장 주변은 선호 음식부터 당겨서 보여준다.
    // 화면엔 너무 길지 않게 5개씩만 — 일치 여부(foodHit)·1순위(topFood)는 자르기 전 전체 목록으로 판단한다.
    const indoorFoodAll = sortIndoorFoodBySeat(indoorFood ?? [], conditions.seat, conditions.food)
    const nearbyFoodAll = sortFoodByPreferred(nearbyFood ?? [], conditions.food)
    const indoorFoodList = indoorFoodAll.slice(0, 5)
    const nearbyFoodList = nearbyFoodAll.slice(0, 5)
    const topFood = indoorFoodAll[0] ?? nearbyFoodAll[0]
    const foodHit = conditions.food === '상관없음'
        || indoorFoodAll.some((f) => f.category === conditions.food)
        || nearbyFoodAll.some((f) => f.category === conditions.food)
    const checklist = {...matchChecklist(game, conditions, mates.length), food: foodHit}
    const match = matchPercent(checklist)
    // Gemini가 만든 추천 이유가 있으면 그걸 쓰고, 조회 전이거나 실패했으면 규칙 기반으로 대신한다.
    const reasons = aiReasons ?? buildReasons({game: displayGame, conditions, foodSpot: topFood})
    const wantsMate = conditions.with === '메이트 구해요'

    const handleCreateMeetup = () => {
        navigate('/mate/write', {
            state: {
                gameId: game.id,
                date: `${game.game_date.slice(5).replace('-', '.')}(${game.start_time.slice(0, 5)})`,
                seat: conditions.seat,
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
                        <span className={`cond-check ${checklist.food ? 'cond-check--hit' : ''}`}>{checklist.food ? '✓' : '✕'} {conditions.food}</span>
                    </div>

                    <div className="game-card__weather">
                        <Icon name="cloud" size={16}/>
                        <span>{displayGame.weather_desc} {displayGame.weather_temp}° · 강수확률 {displayGame.rain_chance}%{liveWeather ? ` · 대기질 ${liveWeather.air_grade}` : ''}</span>
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
                        <span className="info-tile__value">{displayGame.weather_desc} {displayGame.weather_temp}°</span>
                        <span className="info-tile__sub">강수확률 {displayGame.rain_chance}%{liveWeather ? ` · 대기질 ${liveWeather.air_grade}` : ''}</span>
                    </div>
                    <div className="info-tile">
                        <span className="info-tile__label"><Icon name="pin" size={16}/>좌석</span>
                        <span className="info-tile__value">{conditions.seat}</span>
                        <span className="info-tile__sub">선택하신 좌석 조건</span>
                        <a className="info-tile__link" href={ticketSearchUrl(teamName(profile.team))} target="_blank" rel="noreferrer">
                            좌석 확인하기 ›
                        </a>
                    </div>
                    <div className="info-tile">
                        <span className="info-tile__label"><Icon name="train" size={16}/>가는 길</span>
                        <span className="info-tile__value">{stadium?.transit_line ?? '정보 없음'}</span>
                        <span className="info-tile__sub">가장 가까운 지하철역</span>
                    </div>
                </div>

                <h3 className="aiplan__h3">구장 내 맛집</h3>
                {indoorFoodList.length === 0 && <p className="aiplan__empty-mate">이 구장의 구장 내 맛집 정보가 아직 없어요</p>}
                <ul className="food-list">
                    {indoorFoodList.map((f) => (
                        <li key={f.name} className="food-row">
                            <span className="food-row__cat">{f.category}</span>
                            <span className="food-row__body">
                                <strong>{f.name}</strong>
                                <em>{f.location ?? '구장 내'}</em>
                            </span>
                        </li>
                    ))}
                </ul>

                <h3 className="aiplan__h3">구장 주변 맛집</h3>
                {nearbyFoodList.length === 0 && <p className="aiplan__empty-mate">이 구장 주변 맛집 정보가 아직 없어요</p>}
                <ul className="food-list">
                    {nearbyFoodList.map((f) => (
                        <li key={f.name} className="food-row">
                            <span className="food-row__cat">{f.category}</span>
                            <span className="food-row__body">
                                <strong>{f.name}</strong>
                                <em>도보 {f.walk_min}분</em>
                            </span>
                        </li>
                    ))}
                </ul>

                <h3 className="aiplan__h3">직관 타임라인</h3>
                <ul className="timeline">
                    <li><span className="timeline__time">{addMinutes(game.start_time, -60)}</span><span className="timeline__dot"/><span className="timeline__body"><strong>{stadium?.name} 도착</strong><em>게이트 혼잡 전 입장 추천</em></span></li>
                    <li><span className="timeline__time">{addMinutes(game.start_time, -45)}</span><span className="timeline__dot"/><span className="timeline__body"><strong>먹거리 픽업</strong><em>{topFood ? `${topFood.name} 추천` : '구장 먹거리 추천 보기'}</em></span></li>
                    <li><span className="timeline__time">{game.start_time?.slice(0, 5)}</span><span className="timeline__dot timeline__dot--red"/><span className="timeline__body"><strong>플레이볼</strong><em>{conditions.seat} 응원 시작</em></span></li>
                    <li><span className="timeline__time">{addMinutes(game.start_time, 190)}</span><span className="timeline__dot"/><span className="timeline__body"><strong>경기 종료 예상</strong><em>막차까지 여유 있어요</em></span></li>
                </ul>

                {!wantsMate && <MateSection mates={mates}/>}
            </main>

            <div className="aiplan__bottom">
                <div className="aiplan__autofill">
                    <span>모임 글에 자동으로 채워져요</span>
                    <div className="aiplan__autofill-chips">
                        <span>{game.game_date.slice(5).replace('-', '.')}({game.start_time?.slice(0, 5)})</span>
                        <span>{conditions.seat}</span>
                    </div>
                </div>
                <div className="aiplan__actions">
                    <Button variant="primary" className="aiplan__make" onClick={handleCreateMeetup}>
                        <Icon name="plus" size={16}/> 이 일정으로 모임 만들기
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default AiPlan
