import './HistorySummary.css'

/**
 * 내 누적 점수 카드 · 왼쪽 이번 달, 오른쪽 이번 시즌 (점수 + 랭킹)
 * @param {{summary: {month: {points: number, rank: number | null}, season: {points: number, rank: number | null}},
 *          now: Date}} props
 *  rank: 채점된 예측이 없으면 null · now: 월 · 연도 글자를 정하는 지금 시각
 */
function HistorySummary({summary, now}) {
    return (
        <section className="history-summary" aria-label="내 누적 점수">
            <SummaryItem label={`${now.getMonth() + 1}월 누적 점수`} {...summary.month} />
            <span className="history-summary__line" aria-hidden="true" />
            <SummaryItem label={`${now.getFullYear()} 시즌 누적 점수`} {...summary.season} />
        </section>
    )
}

/** 한 칸 · 제목 + 금색 점수 + 흰 알약 순위 */
function SummaryItem({label, points, rank}) {
    return (
        <span className="history-summary__item">
            <span className="history-summary__label">{label}</span>
            <span className="history-summary__points">
                {points.toLocaleString()}
                <span className="history-summary__unit">점</span>
            </span>
            <span className="history-summary__rank">{rank === null ? '순위 없음' : `랭킹 ${rank}위`}</span>
        </span>
    )
}

export default HistorySummary
