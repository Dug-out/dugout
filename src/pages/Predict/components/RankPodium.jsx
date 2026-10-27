import {PROFILE} from '../../../constants/policy.js'
import './RankPodium.css'

// 단상 자리 순서 · 왼쪽 2위, 가운데 1위, 오른쪽 3위
const PLACES = [2, 1, 3]

/**
 * 상위 3명 단상 · "10월 적중왕" + 1 · 2 · 3위 사진 · 닉네임 · 점수
 * @param {{title: string, top: {rank: number, nickname: string, avatarUrl: string | null, points: number}[]}} props
 *  top: 1~3위 (3명이 안 되면 빈 자리는 기본 사진 · "-----" · "0점")
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

/** 단상 한 자리 · 사진 테두리 색으로 순위를 나타낸다 (금 · 은 · 동) */
function PodiumPlace({place, row}) {
    return (
        <span className={`rank-podium__place rank-podium__place--${place}`}>
            <span className="rank-podium__photo">
                <img src={row?.avatarUrl ?? PROFILE.DEFAULT_AVATAR} alt="" />
                <span className="rank-podium__rank">{place}</span>
            </span>
            <span className="rank-podium__name">{row?.nickname ?? '-----'}</span>
            <span className="rank-podium__points">{row ? row.points.toLocaleString() : 0}점</span>
        </span>
    )
}

export default RankPodium
