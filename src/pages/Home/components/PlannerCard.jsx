import {useState} from 'react'
import {useNavigate} from 'react-router'
import Icon from '../../../components/Icon/Icon.jsx'
import {DEFAULT_CONDITIONS, FOOD_OPTIONS, SEAT_OPTIONS, WHEN_OPTIONS} from '../../../constants/planner.js'
import './PlannerCard.css'

// 조건 묶음 · 한 묶음에서 하나만 고른다
const GROUPS = [
    {key: 'when', label: '언제', options: WHEN_OPTIONS},
    {key: 'seat', label: '좌석', options: SEAT_OPTIONS},
    {key: 'food', label: '선호 음식', options: FOOD_OPTIONS},
]

/** 홈 · AI 직관 플래너 카드 · 언제 / 좌석 / 선호 음식을 하나씩 고르고 플랜 만들기 화면(/plans)으로 간다 */
function PlannerCard() {
    const navigate = useNavigate()
    const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)

    return (
        <section className="planner-card" aria-label="AI 직관 플래너">
            {/* 오른쪽 아래 흐린 다이아몬드 장식 */}
            <svg className="planner-card__deco" width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
                <path d="M100 12 L188 100 L100 188 L12 100 Z" fill="none" stroke="currentColor" strokeWidth="10" />
                <path d="M100 60 L140 100 L100 140 L60 100 Z" fill="currentColor" />
            </svg>
            <img className="planner-card__char" src="/assets/planner-chat.png" alt="" width="331" height="360" />

            <div className="planner-card__head">
                <span className="planner-card__badge">
                    <Icon name="sparkle" size={11} strokeWidth={2.4} />
                    AI 직관 플래너
                </span>
                <p className="planner-card__title">
                    조건만 고르면
                    <br />
                    직관 플랜 완성
                </p>
            </div>

            {GROUPS.map(({key, label, options}) => (
                <div key={key} role="radiogroup" aria-label={label} className="planner-card__group">
                    <span className="planner-card__label">{label}</span>
                    <div className="planner-card__chips">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={conditions[key] === option.value}
                                className="planner-card__chip"
                                onClick={() => setConditions((prev) => ({...prev, [key]: option.value}))}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <button
                type="button"
                className="planner-card__submit"
                onClick={() => navigate('/plans', {state: {conditions}})}
            >
                <Icon name="sparkle" size={18} strokeWidth={2.2} />
                AI 직관 플랜 짜기
            </button>
        </section>
    )
}

export default PlannerCard
