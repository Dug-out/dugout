import {formatDay, formatTime} from '../../../utils/mateFormat.js'
import {countdownText, formatCountdown, teamOf} from '../../../utils/predict.js'
import './PredictGameCard.css'

/**
 * 예측할 경기 카드 · 날짜 · 구장, 마감 카운트다운, 내 팀(MY) vs 상대 로고, 올 시즌 상대 전적
 * @param {{game: {gameAt: string, stadium: string, myTeam: string, opponent: string},
 *          record: {win: number, draw: number, lose: number}, remainMs: number}} props
 *  remainMs: 마감(경기 시작 1시간 전)까지 남은 시간 · 0 이면 마감
 */
function PredictGameCard({game, record, remainMs}) {
    const my = teamOf(game.myTeam)
    const opp = teamOf(game.opponent)

    return (
        <section className="predict-game" aria-label="예측할 경기">
            <div className="predict-game__top">
                <span className="predict-game__when">
                    {formatDay(game.gameAt)} {formatTime(game.gameAt)} · {game.stadium}
                </span>
                {/* 마감 카운트다운 · 마감되면 "예측 마감" */}
                <span
                    className="predict-game__deadline"
                    role="timer"
                    aria-label={remainMs > 0 ? `예측 마감까지 ${countdownText(remainMs)}` : '예측 마감'}
                >
                    {/* 시계 아이콘 · 공통 Icon 에 없어서 여기서만 그린다 */}
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="13" r="8" />
                        <path d="M12 9v4l2.5 2M9 2.5h6" />
                    </svg>
                    {remainMs > 0 ? `마감 ${formatCountdown(remainMs)}` : '예측 마감'}
                </span>
            </div>

            <div className="predict-game__teams">
                <TeamLogo team={my} mine />
                <span className="predict-game__vs" aria-hidden="true">
                    VS
                </span>
                <TeamLogo team={opp} />
            </div>

            <p className="predict-game__record">
                <span className="predict-game__record-label">올 시즌 상대 전적</span>
                <strong>
                    {my.label} {record.win}승 {record.draw}무 {record.lose}패
                </strong>
            </p>
        </section>
    )
}

/** 팀 로고 동그라미 + 이름 · 내 팀이면 MY 표시 */
function TeamLogo({team, mine = false}) {
    return (
        <span className="predict-game__team">
            <span className="predict-game__logo">
                {team.icon && <img src={team.icon} alt="" width="48" height="48" />}
            </span>
            <span className="predict-game__name">
                {team.label}
                {mine && <span className="predict-game__my">MY</span>}
            </span>
        </span>
    )
}

export default PredictGameCard
