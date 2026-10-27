import {PROFILE} from '../../../constants/policy.js'
import './RankPodium.css'

// 단상 자리 순서 · 왼쪽 두 번째, 가운데 첫 번째, 오른쪽 세 번째
const PLACES = [2, 1, 3]

/**
 * 상위 3명 단상 · "10월 적중왕" + 앞 3명 사진 · 순위 · 닉네임 · 점수
 * @param {{title: string, top: {rank: number, nickname: string | null, avatarUrl: string | null, points: number | null}[]}} props
 *  top: 순서대로 앞 3명 · 동점이면 순위가 같다 (1, 1, 2) · 빈 자리는 닉네임 · 점수가 null ("-----" · "0점")
 */
function RankPodium({title, top}) {
    return (
        <section className="rank-podium" aria-label="상위 3명">
            <span className="rank-podium__title">{title}</span>
            <div className="rank-podium__places">
                {PLACES.map((place) => (
                    <PodiumPlace key={place} place={place} row={top[place - 1]} />
                ))}
            </div>
        </section>
    )
}

/** 단상 한 자리 · 자리(크기 · 금은동 테두리)는 순서로, 동그라미 숫자는 실제 순위로 */
function PodiumPlace({place, row}) {
    return (
        <span className={`rank-podium__place rank-podium__place--${place}`}>
            <span className="rank-podium__photo">
                <img src={row.avatarUrl ?? PROFILE.DEFAULT_AVATAR} alt="" />
                <span className="rank-podium__rank">{row.rank}</span>
            </span>
            <span className="rank-podium__name">{row.nickname ?? '-----'}</span>
            <span className="rank-podium__points">{(row.points ?? 0).toLocaleString()}점</span>
        </span>
    )
}

export default RankPodium
