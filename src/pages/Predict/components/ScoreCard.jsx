import {SCORE_MAX, SCORE_MIN, outcomeLabel, outcomeOf} from '../../../utils/predict.js'
import './ScoreCard.css'

/**
 * 스코어 예측 카드 · AI 브리핑 띠 + 팀마다 점수 상자와 [−][+] + 결과 배지
 * @param {{myLabel: string, oppLabel: string, my: number | null, opp: number | null,
 *          onChange: (my: number | null, opp: number | null) => void, locked: boolean, aiText: string}} props
 *  my, opp: 아직 안 정했으면 null · locked: 예측 완료나 마감이면 true (점수를 바꿀 수 없다)
 *  aiText: AI 브리핑 띠에 흐르는 글자 (준비 중 · 실패 문구 포함)
 */
function ScoreCard({myLabel, oppLabel, my, opp, onChange, locked, aiText}) {
    const ready = my !== null && opp !== null
    const outcome = ready ? outcomeOf(my, opp) : null

    return (
        <section className="score-card" aria-label="스코어 예측">
            <div className="score-card__ai" role="region" aria-label="AI 경기 브리핑">
                <span className="score-card__ai-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" />
                    </svg>
                    AI 브리핑
                </span>
                {/* 같은 문구를 두 번 이어 붙여 끊김 없이 흐르게 한다 · 두 번째는 화면 읽기에서 뺀다 */}
                <span className="score-card__ai-window">
                    <span className="score-card__ai-tick">
                        <span className="score-card__ai-text">{aiText}</span>
                        <span className="score-card__ai-text" aria-hidden="true">
                            {aiText}
                        </span>
                    </span>
                </span>
            </div>

            <div className="score-card__board">
                <ScoreStepper label={myLabel} value={my} locked={locked} onChange={(next) => onChange(next, opp)} />
                <span className="score-card__colon" aria-hidden="true">
                    :
                </span>
                <ScoreStepper label={oppLabel} value={opp} locked={locked} onChange={(next) => onChange(my, next)} />
            </div>

            {/* 결과 배지 · 두 점수를 비교해 자동으로 정한다 */}
            {ready && (
                <span className={`score-card__result score-card__result--${outcome}`}>
                    {outcomeLabel(outcome, myLabel)} 예측
                </span>
            )}
        </section>
    )
}

/** 한 팀의 점수 상자 + [−][+] · 안 정한 상태(null)는 0 으로 보고 세서, − 는 0, + 는 1 이 된다 */
function ScoreStepper({label, value, locked, onChange}) {
    const current = value ?? 0
    const down = () => onChange(Math.max(SCORE_MIN, current - 1))
    const up = () => onChange(Math.min(SCORE_MAX, current + 1))

    return (
        <span className="score-card__team">
            <span className="score-card__team-name">{label}</span>
            <span className={`score-card__box${value === null ? '' : ' score-card__box--filled'}`} aria-live="polite">
                {value ?? '–'}
            </span>
            <span className="score-card__stepper">
                <button
                    type="button"
                    className="score-card__step"
                    aria-label={`${label} 점수 내리기`}
                    onClick={down}
                    disabled={locked || value === SCORE_MIN}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <path d="M5 12h14" />
                    </svg>
                </button>
                <span className="score-card__step-line" aria-hidden="true" />
                <button
                    type="button"
                    className="score-card__step"
                    aria-label={`${label} 점수 올리기`}
                    onClick={up}
                    disabled={locked || value === SCORE_MAX}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            </span>
        </span>
    )
}

export default ScoreCard
