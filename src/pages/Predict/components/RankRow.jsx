import {PROFILE} from '../../../constants/policy.js'
import './RankRow.css'

/**
 * 랭킹 한 줄 · 순위 · 사진 · 닉네임 · 점수
 *  - 목록(기본): 4~10위 줄 · 내 줄이면 연한 바탕 + "(나)"
 *  - bar: 화면 아래 고정된 내 줄 · 닉네임 옆 "나" 알약, 점수에 "점"
 * 값이 없으면 · 순위 칸 "내 순위", 닉네임 "-----", 점수 "0점"
 * @param {{row: {rank: number | null, nickname: string | null, avatarUrl: string | null, points: number | null,
 *          isMe?: boolean}, bar?: boolean}} props
 */
function RankRow({row, bar = false}) {
    const {rank, avatarUrl, points, isMe} = row
    const nickname = row.nickname ?? '-----'
    const Tag = bar ? 'div' : 'li'
    const classes = ['rank-row', bar && 'rank-row--bar', !bar && isMe && 'rank-row--me'].filter(Boolean).join(' ')

    return (
        <Tag className={classes}>
            {rank === null ? (
                <span className="rank-row__rank rank-row__rank--empty">내 순위</span>
            ) : (
                <span className="rank-row__rank">{rank}</span>
            )}
            <img className="rank-row__photo" src={avatarUrl ?? PROFILE.DEFAULT_AVATAR} alt="" width="34" height="34" />
            <span className="rank-row__name">
                {bar ? (
                    <>
                        {nickname} <span className="rank-row__me">나</span>
                    </>
                ) : isMe ? (
                    `${nickname} (나)`
                ) : (
                    nickname
                )}
            </span>
            {/* 목록 점수는 디자인대로 숫자만, 아래 내 줄과 빈 자리는 "점"을 붙인다 */}
            <span className="rank-row__points">
                {points === null ? '0점' : `${points.toLocaleString()}${bar ? '점' : ''}`}
            </span>
        </Tag>
    )
}

export default RankRow
