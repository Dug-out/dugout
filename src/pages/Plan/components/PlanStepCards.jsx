import Icon from '../../../components/Icon/Icon.jsx'
import {ARRIVE_BEFORE_MINUTES} from '../../../constants/planner.js'
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

/**
 * 구장 안 맛집 카드 · 사진 자리(아직 사진이 없어 색 배경), 매장 이름, 구장 안 위치(있을 때), 음식 종류
 * @param {{food: {name: string, category: string, location: string | null}}} props
 */
export function FoodCard({food}) {
    return (
        <div className="plan-card">
            <span className="plan-card__photo">
                <Icon name="food" size={22} />
            </span>
            <span className="plan-card__text">
                <strong>{food.name}</strong>
                {food.location && <span>{food.location}</span>}
                <span>{food.category}</span>
            </span>
        </div>
    )
}

/** 구장 안 맛집이 없을 때 안내 */
export function FoodEmpty() {
    return (
        <div className="plan-card plan-card--empty">
            <span className="plan-card__text">
                <span>이 구장의 구장 안 맛집 정보가 아직 없어요</span>
            </span>
        </div>
    )
}

/**
 * 출발 카드 · 출발지와 도착 목표 시각, 카카오맵 길찾기 링크 (이동 시간은 길찾기 API 를 붙이기 전까지 알 수 없어서 링크로 대신한다)
 * @param {{origin: {label: string}, arriveTime: string, link: string | null}} props
 */
export function RouteCard({origin, arriveTime, link}) {
    return (
        <div className="plan-card plan-card--route">
            <div className="plan-route">
                <span className="plan-route__point">
                    <span className="plan-route__label">출발지</span>
                    <strong>{origin.label}</strong>
                </span>
                <Icon name="chevronRight" size={20} className="plan-route__arrow" />
                <span className="plan-route__point plan-route__point--end">
                    <span className="plan-route__label">도착 목표</span>
                    <strong>{arriveTime}</strong>
                    <span className="plan-route__note">경기 {ARRIVE_BEFORE_MINUTES}분 전</span>
                </span>
            </div>
            {link && (
                <a className="plan-route__link" href={link} target="_blank" rel="noopener noreferrer">
                    카카오맵으로 길찾기
                    <Icon name="external" size={14} strokeWidth={2.4} />
                </a>
            )}
        </div>
    )
}
