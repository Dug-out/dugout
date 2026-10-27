import {useEffect, useState} from 'react'
import {Link, useLocation, useNavigate} from 'react-router'
import {Header, Icon, Loading} from '../../components'
import {DEFAULT_CONDITIONS, DEFAULT_ORIGIN, FOOD_OPTIONS, SEAT_OPTIONS, WHEN_OPTIONS} from '../../constants/planner.js'
import './Plan.css'

// 옵션 값 → 칩에 보이는 글자
const labelOf = (options, value) => options.find((option) => option.value === value)?.label

/** AI 직관 플랜 · 출발 위치 화면 (/plans) · 홈에서 고른 조건과 출발 위치를 보여 주고, 플랜을 짜면 결과 화면으로 간다 */
function Plan() {
    const navigate = useNavigate()
    const {state} = useLocation()
    // 홈에서 고른 조건 · 탭바로 바로 들어오면 기본 조건
    const conditions = state?.conditions ?? DEFAULT_CONDITIONS
    const origin = DEFAULT_ORIGIN

    // 플랜을 짜는 중인지
    const [making, setMaking] = useState(false)

    // 플랜 짜기 · 아직 서버를 붙이지 않아서 잠깐 로딩을 보여 주고 결과 화면(빈 화면)으로 간다
    useEffect(() => {
        if (!making) return
        const timer = setTimeout(() => navigate('/plans/result', {state: {conditions, origin}}), 1500)
        return () => clearTimeout(timer)
    }, [making, navigate, conditions, origin])

    if (making) return <Loading />

    const chips = [
        labelOf(WHEN_OPTIONS, conditions.when),
        labelOf(SEAT_OPTIONS, conditions.seat),
        labelOf(FOOD_OPTIONS, conditions.food),
    ]

    return (
        <div className="plan">
            <Header title="AI 직관 플랜" backTo="/home" />

            <div className="plan__head">
                <h2 className="plan__title">어디서 출발하세요?</h2>
                <div className="plan__chips">
                    {chips.map((chip) => (
                        <span key={chip} className="plan__chip">
                            {chip}
                        </span>
                    ))}
                    <Link to="/home" className="plan__edit">
                        조건 수정
                    </Link>
                </div>
            </div>

            {/* 출발 위치 · 지도로 고르는 화면이 생기기 전까지는 강남역 하나로 정해져 있다 */}
            <div className="plan__sheet">
                <div className="plan__place">
                    <span className="plan__pin">
                        <Icon name="pin" size={18} />
                    </span>
                    <span className="plan__place-text">
                        <strong>{origin.label}</strong>
                        <span>{origin.address}</span>
                    </span>
                </div>
                <button type="button" className="plan__make" onClick={() => setMaking(true)}>
                    이 위치에서 플랜 짜기
                </button>
            </div>
        </div>
    )
}

export default Plan
