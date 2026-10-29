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
 * 구장 안 맛집 카드 · 매장 사진(있으면), 매장 이름, 구장 안 위치(있을 때), 음식 종류
 * @param {{food: {name: string, category: string, location: string | null, photoUrl: string | null}}} props
 */
export function FoodCard({food}) {
    return (
        <div className="plan-card">
            <span className="plan-card__photo">
                {food.photoUrl ? (
                    <img src={food.photoUrl} alt="" className="plan-card__photo-img" />
                ) : (
                    <Icon name="food" size={22} />
                )}
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

// 구간 종류별 막대 · 목록 알약 색
const LEG_TONES = {walk: 'walk', subway: 'subway', bus: 'bus'}

/**
 * 출발 카드 · 대중교통 경로를 받았으면 출발·도착 시각, 구간 막대, 구간 목록을 보여 주고
 * 못 받았으면(키 없음, 시외 이동 등) 출발지와 도착 목표 시각만 보여 준다. 둘 다 카카오맵 길찾기 링크가 아래에 있다.
 * @param {{origin: {label: string}, arriveTime: string, leaveTime: string | null,
 *   route: null | {total: number, legs: {type: string, name: string | null, title: string, to: string | null, note: string | null, min: number}[]},
 *   link: string | null}} props
 */
export function RouteCard({origin, arriveTime, leaveTime, route, link}) {
    return (
        <div className="plan-card plan-card--route">
            {route ? (
                <>
                    <div className="plan-trip__box">
                        <span className="plan-trip__point">
                            <span className="plan-trip__label">출발</span>
                            <strong className="plan-trip__time">{leaveTime}</strong>
                            <span className="plan-trip__place">{origin.label}</span>
                        </span>
                        <Icon name="chevronRight" size={20} className="plan-trip__arrow" />
                        <span className="plan-trip__point plan-trip__point--end">
                            <span className="plan-trip__label">도착</span>
                            <strong className="plan-trip__time">{arriveTime}</strong>
                            <span className="plan-trip__place">경기 {ARRIVE_BEFORE_MINUTES}분 전</span>
                        </span>
                    </div>

                    <div className="plan-trip__bar" role="img" aria-label="구간별 소요 시간">
                        {route.legs.map((leg, index) => (
                            <span
                                key={index}
                                className={`plan-trip__seg plan-trip__seg--${LEG_TONES[leg.type]}`}
                                style={{flex: leg.min}}
                            />
                        ))}
                    </div>

                    <ol className="plan-trip__legs">
                        {route.legs.map((leg, index) => (
                            <li key={index} className="plan-trip__leg">
                                <span className={`plan-trip__pill plan-trip__pill--${LEG_TONES[leg.type]}`}>
                                    {leg.type === 'walk' ? <Icon name="walk" size={16} /> : leg.name}
                                </span>
                                <span className="plan-trip__text">
                                    <strong>{leg.title}</strong>
                                    {leg.to && <strong>→ {leg.to}</strong>}
                                    {leg.note && <span>{leg.note}</span>}
                                </span>
                                <span className="plan-trip__min">{leg.min}분</span>
                            </li>
                        ))}
                    </ol>
                </>
            ) : (
                <dl className="plan-route">
                    <div className="plan-route__row">
                        <dt>출발지</dt>
                        <dd>{origin.label}</dd>
                    </div>
                    <div className="plan-route__row">
                        <dt>도착 목표</dt>
                        <dd>
                            {arriveTime}
                            <span className="plan-route__note"> · 경기 {ARRIVE_BEFORE_MINUTES}분 전</span>
                        </dd>
                    </div>
                </dl>
            )}
            {link && (
                <a className="plan-route__link" href={link} target="_blank" rel="noopener noreferrer">
                    카카오맵으로 길찾기
                    <Icon name="external" size={14} strokeWidth={2.4} />
                </a>
            )}
        </div>
    )
}
