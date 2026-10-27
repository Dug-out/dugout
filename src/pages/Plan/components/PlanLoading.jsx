import './PlanLoading.css'

/**
 * 플랜 짜는 중 화면 · 흔들리는 마스코트, 안내 문구, 진행 막대
 * @param {{ms: number, onSkip: () => void}} props
 *  ms: 이 화면이 보이는 시간 · 진행 막대가 이 시간에 맞춰 끝까지 차오른다
 *  onSkip: [결과 보기]를 눌렀을 때 (기다리지 않고 바로 결과 화면으로)
 */
function PlanLoading({ms, onSkip}) {
    return (
        // role="status": 화면 읽기 프로그램이 "플랜 짜는 중"을 알려 준다
        <div className="plan-loading" role="status" aria-live="polite" style={{'--plan-loading-ms': `${ms}ms`}}>
            <span className="plan-loading__mascot">
                <img className="plan-loading__image" src="/assets/planner-chat.png" alt="" width="331" height="360" />
                <span className="plan-loading__shadow" aria-hidden="true" />
            </span>

            <span className="plan-loading__text">
                <strong className="plan-loading__title">플랜 짜는 중이에요</strong>
                <span className="plan-loading__desc">조건에 맞는 경기와 이동 경로를 찾고 있어요</span>
            </span>

            <span className="plan-loading__track" aria-hidden="true">
                <span className="plan-loading__bar" />
            </span>

            <button type="button" className="plan-loading__skip" onClick={onSkip}>
                결과 보기 ›
            </button>
        </div>
    )
}

export default PlanLoading
