import './PlanSteps.css'

/**
 * 나의 직관 플랜 · 번호가 이어지는 세로 단계 목록 (번호는 목록 순서대로 1, 2, 3 … 마지막 단계만 빨강)
 * @param {{steps: {key: string, time?: string, title: string, children: import('react').ReactNode}[]}} props
 *  time: 단계 시각 ('17:30') · 없으면 생략
 */
function PlanSteps({steps}) {
    return (
        <ol className="plan-steps">
            {steps.map(({key, time, title, children}, index) => {
                const last = index === steps.length - 1
                return (
                    <li key={key} className={`plan-steps__item${last ? ' plan-steps__item--last' : ''}`}>
                        <span className="plan-steps__rail">
                            <span className="plan-steps__number">{index + 1}</span>
                            <span className="plan-steps__line" />
                        </span>
                        <div className="plan-steps__body">
                            <div className="plan-steps__head">
                                {time && <span className="plan-steps__time">{time}</span>}
                                <strong className="plan-steps__title">{title}</strong>
                            </div>
                            {children}
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}

export default PlanSteps
