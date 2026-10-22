import './ScoreTile.css'

// 8점 이상 빨강 / 5~7점 회색 / 4점 이하 진한 회색 (평가 표정 기준과 같다)
const toneFromScore = (score) => (score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low')

/** 메이트 평가 점수 칸 (52×44) · score: 1~10 */
function ScoreTile({score, className = '', ...rest}) {
    const classes = ['score-tile', `score-tile--${toneFromScore(score)}`, className].join(' ')

    return (
        <span className={classes} aria-label={`${score}점`} {...rest}>
            <span className="score-tile__num" aria-hidden="true">{score}</span>
            <span className="score-tile__unit" aria-hidden="true">점</span>
        </span>
    )
}

export default ScoreTile
