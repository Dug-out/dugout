import Icon from '../../../components/Icon/Icon.jsx'
import {formatDay, formatTime, matchLabel} from '../../../utils/mateFormat.js'
import './PlanStepCards.css'

/**
 * 티켓 예매 카드 · 누르면 예매처가 새 탭으로 열린다 (예매처를 모르면 눌리지 않는 안내만)
 * @param {{game: object, myTeam: string, seat: string, ticket: null | {name: string, url: string}}} props
 */
export function TicketCard({game, myTeam, seat, ticket}) {
    const body = (
        <>
            <span className="plan-card__icon">
                <Icon name="ticket" size={20} />
            </span>
            <span className="plan-card__text">
                <strong>
                    {matchLabel(game, myTeam)} · {seat}
                </strong>
                <span>
                    {formatDay(game.gameAt)} {formatTime(game.gameAt)}
                    {ticket && ` · ${ticket.name}`}
                </span>
            </span>
            {ticket && (
                <span className="plan-card__action">
                    예매
                    <Icon name="external" size={14} strokeWidth={2.4} />
                </span>
            )}
        </>
    )

    return ticket ? (
        <a className="plan-card plan-card--link" href={ticket.url} target="_blank" rel="noopener noreferrer">
            {body}
        </a>
    ) : (
        <div className="plan-card">{body}</div>
    )
}

/** 경기 관람 카드 · 플레이볼, 구장과 좌석 */
export function WatchCard({game, myTeam, seat}) {
    return (
        <div className="plan-card">
            <span className="plan-card__icon plan-card__icon--red">
                <Icon name="ball" size={20} />
            </span>
            <span className="plan-card__text">
                <strong>{matchLabel(game, myTeam)} 플레이볼</strong>
                <span>
                    {game.stadium} · {seat}
                </span>
            </span>
        </div>
    )
}
