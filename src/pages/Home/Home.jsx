import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'
import {fetchMyProfile} from '../../api/profile.js'
import {Button, Header} from '../../components'
import Icon from '../../components/Icon/Icon.jsx'
import {DEFAULT_CONDITIONS, FOOD_OPTIONS, SEAT_OPTIONS, WHEN_OPTIONS, WITH_OPTIONS} from '../../constants/planner.js'
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

/** 홈 · AI 직관 플래너 */
function Home() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)

    useEffect(() => {
        let alive = true
        fetchMyProfile().then((p) => alive && setProfile(p)).catch((e) => console.error(e))
        return () => { alive = false }
    }, [])

    const set = (key) => (value) => setConditions((prev) => ({...prev, [key]: value}))

    const goToPlan = () => navigate('/ai-plan', {state: {conditions}})

    return (
        <div className="home">
            <Header large title={
                <img className="home__logo" src="/assets/logo.png" alt="DUGOUT" width="108" height="36"/>
            }/>

            <main className="home__main">
                <div className="home__intro">
                    <p className="home__intro-sub">{profile ? `${teamName(profile.team)} 팬 · ${profile.nickname}님` : ' '}</p>
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
                    <ConditionGroup label="선호 음식" options={FOOD_OPTIONS} value={conditions.food} onChange={set('food')}/>

                    <Button variant="primary" block className="planner-card__submit" onClick={goToPlan}>
                        <Icon name="sparkle" size={15}/> AI 직관 플랜 짜기
                    </Button>
                    <p className="planner-card__caption">응원팀과 출발 지역은 프로필 정보로 반영돼요</p>
                </section>
            </main>
        </div>
    )
}

export default Home
