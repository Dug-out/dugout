import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router'
import {countSavedPlans, dday} from '../../api/planner.js'
import {fetchMyNextMeetup, updateMeetupChecklist} from '../../api/mate.js'
import {fetchMyProfile} from '../../api/profile.js'
import {Button, Header, TabBar} from '../../components'
import Icon from '../../components/Icon/Icon.jsx'
import {BUDGET_OPTIONS, DEFAULT_CONDITIONS, FOOD_OPTIONS, PREP_ITEMS, SEAT_OPTIONS, WHEN_OPTIONS, WITH_OPTIONS} from '../../constants/planner.js'
import {MOCK_MATE_POSTS} from '../../constants/mate.js'
import {SIGNUP} from '../../constants/policy.js'
import './Home.css'

const teamName = (code) => SIGNUP.TEAMS.find((t) => t.code === code)?.name ?? code

function ConditionGroup({label, options, value, onChange}) {
    return (
        <div className="cond-group">
            <span className="cond-group__label">{label}</span>
            <div className="cond-group__row">
                {options.map((option) => (
                    <button key={option} type="button" className={`cond-chip ${option === value ? 'cond-chip--selected' : ''}`}
                            aria-pressed={option === value} onClick={() => onChange(option)}>
                        {option}
                    </button>
                ))}
            </div>
        </div>
    )
}

/** "내 다음 직관" · 내가 만들었거나 참여 확정된 모임 1개 */
function NextMeetupCard({meetup, onToggle}) {
    const doneCount = PREP_ITEMS.filter((item) => meetup.checklist?.[item.key]).length
    const weekday = new Date(`${meetup.gameDate}T00:00:00`).toLocaleDateString('ko-KR', {weekday: 'long'})
    const [mm, dd] = meetup.gameDate.slice(5).split('-')

    return (
        <div className="next-plan">
            <Link to={`/mate/${meetup.id}`} className="next-plan__top">
                <div className="next-plan__dday">
                    <span className="next-plan__weekday">{weekday}</span>
                    <span className="next-plan__date">{mm}.{dd}</span>
                    <span className="next-plan__d">{dday(meetup.gameDate)}</span>
                </div>
                <div className="next-plan__info">
                    <span className="next-plan__title">{teamName(meetup.homeTeam)} vs {teamName(meetup.awayTeam)} · {meetup.stadiumName} {meetup.startTime}</span>
                    <span className="next-plan__sub">{meetup.title} · {meetup.role === 'host' ? '내가 만든 모임' : '참여 확정'}</span>
                    <span className="next-plan__sub">{meetup.seatZone} · {meetup.joined}/{meetup.capacity}명</span>
                </div>
            </Link>
            <div className="next-plan__divider"/>
            <div className="next-plan__prep">
                <span>직관 준비</span>
                <span className="next-plan__prep-count">{doneCount} / 4 완료</span>
            </div>
            <div className="next-plan__chips">
                {PREP_ITEMS.map((item) => {
                    const done = !!meetup.checklist?.[item.key]
                    return (
                        <button key={item.key} type="button" className={`prep-chip ${done ? 'prep-chip--done' : ''}`}
                                onClick={() => onToggle(item.key, !done)}>
                            {done && <Icon name="check" size={12}/>}{item.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function EmptyNextMeetup({onFind}) {
    return (
        <div className="next-plan next-plan--empty">
            <span>아직 참여하거나 만든 직관 모임이 없어요</span>
            <Button variant="secondary" onClick={onFind}>메이트 찾아보기</Button>
        </div>
    )
}

function MateMiniItem({post}) {
    const left = post.capacity - post.joined
    const [mm, dd] = post.gameDate.slice(5).split('-')
    return (
        <li>
            <Link to={`/mate/${post.id}`} className="mate-mini">
                <div className="mate-mini__date">
                    <span>{mm}.{dd}</span>
                    <span className="mate-mini__d">{dday(post.gameDate)}</span>
                </div>
                <div className="mate-mini__body">
                    <span className="mate-mini__title">{post.title}</span>
                    <span className="mate-mini__sub">{post.place} · {post.joined}/{post.capacity}명</span>
                </div>
                {left > 0 && <span className="mate-mini__badge">{left}자리 남음</span>}
            </Link>
        </li>
    )
}

/** 홈 · AI 직관 플래너 + 내 다음 직관 + 모집 중인 메이트 (사용자 구상 화면 기준) */
function Home() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)
    const [nextMeetup, setNextMeetup] = useState(null)
    const [savedCount, setSavedCount] = useState(0)

    useEffect(() => {
        let alive = true
        fetchMyProfile().then((p) => alive && setProfile(p)).catch((e) => console.error(e))
        return () => { alive = false }
    }, [])

    useEffect(() => {
        if (!profile) return undefined
        let alive = true
        Promise.all([fetchMyNextMeetup(profile.id), countSavedPlans(profile.id)])
            .then(([meetup, count]) => { if (alive) { setNextMeetup(meetup); setSavedCount(count) } })
            .catch((e) => console.error(e))
        return () => { alive = false }
    }, [profile])

    const set = (key) => (value) => setConditions((prev) => ({...prev, [key]: value}))

    const goToPlan = () => navigate('/ai-plan', {state: {conditions}})

    const togglePrep = async (key, value) => {
        const checklist = {...nextMeetup.checklist, [key]: value}
        setNextMeetup((prev) => ({...prev, checklist}))
        try {
            await updateMeetupChecklist(nextMeetup.id, checklist)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="home">
            <Header large title={
                <img className="home__logo" src="/assets/logo.png" alt="DUGOUT" width="108" height="36"/>
            }/>

            <main className="home__main">
                <div className="home__intro">
                    <p className="home__intro-sub">{profile ? `${teamName(profile.team)} 팬 · ${profile.nickname}님` : ' '}</p>
                    <h2 className="home__intro-title">이번 주, 어디로 직관 갈까요?</h2>
                </div>

                <section className="planner-card">
                    <img className="planner-card__char" src="/assets/pose-cheer.png" alt="" width="96" height="96"/>
                    <span className="planner-card__badge"><Icon name="sparkle" size={13}/>AI 직관 플래너</span>
                    <h3 className="planner-card__title">조건만 고르면<br/>직관 플랜 완성</h3>
                    <p className="planner-card__desc">경기 · 좌석 · 날씨 · 같이 갈 메이트까지</p>

                    <ConditionGroup label="언제" options={WHEN_OPTIONS} value={conditions.when} onChange={set('when')}/>
                    <ConditionGroup label="누구랑" options={WITH_OPTIONS} value={conditions.with} onChange={set('with')}/>
                    <ConditionGroup label="좌석" options={SEAT_OPTIONS} value={conditions.seat} onChange={set('seat')}/>
                    <ConditionGroup label="예산 (1인)" options={BUDGET_OPTIONS} value={conditions.budget} onChange={set('budget')}/>
                    <ConditionGroup label="선호 음식" options={FOOD_OPTIONS} value={conditions.food} onChange={set('food')}/>

                    <Button variant="primary" block className="planner-card__submit" onClick={goToPlan}>
                        <Icon name="sparkle" size={15}/> AI 직관 플랜 짜기
                    </Button>
                    <p className="planner-card__caption">응원팀과 출발 지역은 프로필 정보로 반영돼요</p>
                </section>

                <section className="home__section">
                    <div className="home__section-head">
                        <h3>내 다음 직관</h3>
                        {savedCount > 0 && (
                            <Link to="/plans" className="home__link">저장한 플랜 {savedCount} <Icon name="chevron" size={14}/></Link>
                        )}
                    </div>
                    {profile && (nextMeetup
                        ? <NextMeetupCard meetup={nextMeetup} onToggle={togglePrep}/>
                        : <EmptyNextMeetup onFind={() => navigate('/mate')}/>)}
                </section>

                <section className="home__section">
                    <div className="home__section-head">
                        <h3>모집 중인 메이트</h3>
                        <Link to="/mate" className="home__link">전체보기 <Icon name="chevron" size={14}/></Link>
                    </div>
                    <ul className="mate-mini-list">
                        {MOCK_MATE_POSTS.map((post) => <MateMiniItem key={post.id} post={post}/>)}
                    </ul>
                </section>
            </main>

            <TabBar/>
        </div>
    )
}

export default Home
