import {useState} from 'react'
import {formatDay, formatDday, formatTime} from '../../../utils/mateFormat.js'
import {teamOf} from '../../../utils/predict.js'
import './PlanGameCard.css'

/**
 * 추천 경기 카드 · D-day와 날짜, 홈팀 vs 원정팀과 시작 시각, 구장과 모집 글 수
 * @param {{game: {gameAt: string, home: string, away: string, stadium: string}, mateCount: number}} props
 */
function PlanGameCard({game, mateCount}) {
    // 화면이 뜬 시각 · D-day 계산에 쓴다
    const [now] = useState(() => Date.now())

    return (
        <section className="plan-game" aria-label="추천 경기">
            {/* 가운데 흐린 다이아몬드 장식 */}
            <svg className="plan-game__deco" width="220" height="220" viewBox="0 0 200 200" aria-hidden="true">
                <path d="M100 12 L188 100 L100 188 L12 100 Z" fill="none" stroke="currentColor" strokeWidth="10" />
                <path d="M100 60 L140 100 L100 140 L60 100 Z" fill="currentColor" />
            </svg>

            <div className="plan-game__top">
                <span className="plan-game__dday">{formatDday(game.gameAt, now)}</span>
                <span className="plan-game__day">{formatDay(game.gameAt)}</span>
            </div>

            <div className="plan-game__teams">
                <Team code={game.home} side="HOME" />
                <span className="plan-game__center">
                    <span className="plan-game__time">{formatTime(game.gameAt)}</span>
                    <span className="plan-game__vs">VS</span>
                </span>
                <Team code={game.away} side="AWAY" />
            </div>

            <div className="plan-game__foot">
                <svg className="plan-game__pin" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" fill="currentColor" />
                    <circle cx="12" cy="10" r="2.6" fill="var(--surface)" />
                </svg>
                {game.stadium}
                <span className="plan-game__mates">모집 글 {mateCount}개</span>
            </div>
        </section>
    )
}

/** 팀 로고 + 이름 + HOME / AWAY */
function Team({code, side}) {
    const team = teamOf(code)

    return (
        <span className="plan-game__team">
            {team.icon && <img className="plan-game__logo" src={team.icon} alt="" width="240" height="240" />}
            <strong className="plan-game__name">{team.label}</strong>
            <span className="plan-game__side">{side}</span>
        </span>
    )
}

export default PlanGameCard
