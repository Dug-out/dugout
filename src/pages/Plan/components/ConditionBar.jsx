import './ConditionBar.css'

/**
 * 고른 조건 줄 · 칸마다 이름과 값 (응원팀 · 언제 · 좌석 · 음식)
 * @param {{items: {label: string, value: string, tone?: 'team'}[]}} props tone team: 값을 빨강으로 (응원팀)
 */
function ConditionBar({items}) {
    return (
        <section className="condition-bar" aria-label="고른 조건">
            {items.map(({label, value, tone}) => (
                <span key={label} className="condition-bar__item">
                    <span className="condition-bar__label">{label}</span>
                    <strong className={`condition-bar__value${tone === 'team' ? ' condition-bar__value--team' : ''}`}>
                        {value}
                    </strong>
                </span>
            ))}
        </section>
    )
}

export default ConditionBar
