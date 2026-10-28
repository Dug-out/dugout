import {Link} from 'react-router'
import {PROFILE} from '../../../constants/policy.js'
import './PlanMates.css'

/**
 * 같은 경기 · 같은 좌석에서 같이 볼 직관 모임 · 최근 모집 글 2개와 전체 개수 (글이 없으면 안내)
 * @param {{seat: string, mates: {count: number, items: {id: string, title: string, seat: string, capacity: number,
 *   joined: number, host: string, avatarUrl: string | null}[]}}} props
 */
function PlanMates({seat, mates}) {
    return (
        <section className="plan-mates" aria-label="같이 볼 모임">
            <div className="plan-mates__head">
                <h2 className="plan-mates__title">
                    <span className="plan-mates__seat">{seat}</span>에서 같이 볼 직관 모임
                </h2>
                {mates.count > 0 && (
                    <Link to="/mate" className="plan-mates__all">
                        전체 {mates.count}개 ›
                    </Link>
                )}
            </div>

            {mates.items.length > 0 ? (
                <ul className="plan-mates__list">
                    {mates.items.map((mate) => (
                        <li key={mate.id}>
                            <Link to={`/mate/${mate.id}`} className="plan-mates__item">
                                <img
                                    className="plan-mates__avatar"
                                    src={mate.avatarUrl || PROFILE.DEFAULT_AVATAR}
                                    alt=""
                                    width="512"
                                    height="512"
                                />
                                <span className="plan-mates__text">
                                    <strong>{mate.title}</strong>
                                    <span>
                                        {mate.host} · {mate.seat}
                                    </span>
                                </span>
                                <span className="plan-mates__count">
                                    {mate.joined}/{mate.capacity}명
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="plan-mates__empty">
                    <strong>아직 이 경기 모집글이 없어요</strong>
                    <span>메이트 찾기에서 첫 모집글을 올려 보세요</span>
                </div>
            )}
        </section>
    )
}

export default PlanMates
