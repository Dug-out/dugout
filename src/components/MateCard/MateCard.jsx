import {Link} from 'react-router'
import Icon from '../Icon/Icon.jsx'
import Tag from '../Tag/Tag.jsx'
import './MateCard.css'
import {MATE_POST, PROFILE} from '../../constants/policy.js'

// 매너 타율 .389 형태로 표시
const formatManner = (value) => value.toFixed(3).replace(/^0/, '')

/**
 * 모집 글 카드 (A형) · 이미지 140px
 * @param {string} [to] 상세 화면 경로. 있으면 카드 전체가 링크
 * @param {string} [image] 대표 이미지. 없으면 기본 이미지
 * @param {'open'|'closed'} status 모집 중(빨강) / 모집 마감(회색)
 * @param {string} [dday] 오른쪽 위 D-day ('D-1')
 * @param {string} title 제목
 * @param {string} date '10.22 (목) 18:30 · LG vs 두산'
 * @param {string} place 구장
 * @param {string[]} [tags] 조건 태그 (좌석 · 나이대 · 성별)
 * @param {{name: string, avatar?: string, manner: number}} host 방장
 * @param {number} joined 현재 인원 (방장 포함)
 * @param {number} capacity 모집 인원
 */
function MateCard({
    to,
    image = MATE_POST.DEFAULT_IMAGE,
    status = 'open',
    dday,
    title,
    date,
    place,
    tags = [],
    host,
    joined,
    capacity,
    className = '',
}) {
    const Component = to ? Link : 'article'
    const classes = ['mate-card', className].filter(Boolean).join(' ')

    return (
        <Component className={classes} {...(to ? {to} : {})}>
            <span className="mate-card__image">
                <img src={image} alt="" width="350" height="140" />
                <span className={`mate-card__status mate-card__status--${status}`}>
                    {status === 'open' ? '모집 중' : '모집 마감'}
                </span>
                {dday && <span className="mate-card__dday">{dday}</span>}
            </span>

            <span className="mate-card__body">
                <span className="mate-card__title">{title}</span>

                <span className="mate-card__info">
                    <span className="mate-card__date">
                        <Icon name="calendar" size={14} />
                        {date}
                    </span>
                    <span className="mate-card__place">
                        <Icon name="pin" size={14} />
                        {place}
                    </span>
                </span>

                {tags.length > 0 && (
                    <span className="mate-card__tags">
                        {tags.map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                        ))}
                    </span>
                )}

                <span className="mate-card__divider" />

                <span className="mate-card__host">
                    <img src={host.avatar ?? PROFILE.DEFAULT_AVATAR} alt="" width="24" height="24" />
                    <span className="mate-card__host-name">{host.name}</span>
                    <span className="mate-card__manner">
                        매너 타율 <strong>{formatManner(host.manner)}</strong>
                    </span>
                </span>

                <span className="mate-card__progress">
                    <span className="mate-card__bar" aria-hidden="true">
                        <span style={{width: `${Math.min(100, (joined / capacity) * 100)}%`}} />
                    </span>
                    <span className="mate-card__count">
                        <strong>
                            {joined}/{capacity}
                        </strong>
                        명
                    </span>
                </span>
            </span>
        </Component>
    )
}

export default MateCard
