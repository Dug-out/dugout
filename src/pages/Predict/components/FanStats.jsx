import {percentOf} from '../../../utils/predict.js'
import './FanStats.css'

/**
 * 같은 응원팀 팬 예측 비율 · 참여 인원, 승/무/패 막대, 가장 많이 예측한 스코어
 * @param {{teamLabel: string, stats: {total: number, win: number, draw: number, lose: number,
 *          top: null | {my: number, opp: number, count: number}}}} props
 */
function FanStats({teamLabel, stats}) {
    const {total, top} = stats
    const win = percentOf(stats.win, total)
    const draw = percentOf(stats.draw, total)
    // 반올림 때문에 합이 100 이 안 될 수 있어 패배는 나머지로 채운다
    const lose = total > 0 ? 100 - win - draw : 0

    return (
        <section className="fan-stats" aria-label={`${teamLabel}팬 예측 현황`}>
            <div className="fan-stats__head">
                <h2 className="fan-stats__title">{teamLabel}팬은 이렇게 봤어요</h2>
                <span className="fan-stats__total">{total.toLocaleString()}명 참여</span>
            </div>

            {total === 0 ? (
                <p className="fan-stats__empty">아직 예측한 팬이 없어요</p>
            ) : (
                <>
                    <div className="fan-stats__rates">
                        <div className="fan-stats__bar" aria-hidden="true">
                            {/* 0% 인 칸은 그리지 않는다 (틈만 남지 않게) */}
                            {win > 0 && (
                                <span className="fan-stats__seg fan-stats__seg--win" style={{width: `${win}%`}} />
                            )}
                            {draw > 0 && (
                                <span className="fan-stats__seg fan-stats__seg--draw" style={{width: `${draw}%`}} />
                            )}
                            {lose > 0 && (
                                <span className="fan-stats__seg fan-stats__seg--lose" style={{width: `${lose}%`}} />
                            )}
                        </div>
                        <div className="fan-stats__labels">
                            <span>
                                <strong className="fan-stats__pct--win">{win}%</strong> 승리
                            </span>
                            <span>
                                <strong className="fan-stats__pct--draw">{draw}%</strong> 무승부
                            </span>
                            <span>
                                <strong className="fan-stats__pct--lose">{lose}%</strong> 패배
                            </span>
                        </div>
                    </div>

                    {/* 가장 많이 예측한 스코어 · 동률이면 응원팀 점수가 높은 쪽 (DB 에서 골라 준다) */}
                    {top && (
                        <div className="fan-stats__top">
                            <span className="fan-stats__top-label">🔥 가장 많이 예측한 스코어</span>
                            <span className="fan-stats__top-score">
                                {top.my} : {top.opp}
                            </span>
                            <span className="fan-stats__top-pct">{percentOf(top.count, total)}%</span>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}

export default FanStats
