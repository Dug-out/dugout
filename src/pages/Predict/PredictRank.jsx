import {useState} from 'react'
import {Header} from '../../components'
import PredictTabs from './components/PredictTabs.jsx'
import RankPodium from './components/RankPodium.jsx'
import RankRow from './components/RankRow.jsx'
import './Predict.css'
import './PredictRank.css'

// 기간 전환 · getRanking 에 넘기는 값과 글자
const PERIODS = [
    {key: 'month', label: '월간'},
    {key: 'season', label: '시즌'},
]

/** 승부 예측 · 랭킹 화면 (/predict/rank) · 월간 / 시즌, 1~3위 단상 + 4~10위 목록 + 아래 고정 내 줄 */
function PredictRank() {
    const [period, setPeriod] = useState('month')
    // 적중왕 제목의 월 · 연도를 정하는 지금 시각 · 한 번만 정한다
    const [now] = useState(() => new Date())

    // 🔌 기능 연결 단계: getRanking(period) 로 바꾼다 (같은 응원팀 1~10위 + 내 줄)
    //    데이터가 없어도 틀(단상 · 4~10위 · 내 줄)은 그대로 보이고, 닉네임 · 점수 자리만 비어 있다
    const ranking = null
    // 🔌 기능 연결 단계: 내가 순위에 없을 때 아래 내 줄의 닉네임 · 사진을 useMyProfile 로 채운다
    const myProfile = null

    const ranked = (ranking ?? []).filter((row) => row.rank <= 10)
    const top = ranked.filter((row) => row.rank <= 3)
    const rest = ranked.filter((row) => row.rank > 3)
    // 4~10위 7줄 · 사람이 모자라면 빈 줄("-----" · "0점")로 채운다
    const restSlots = Array.from(
        {length: 7},
        (_, i) => rest[i] ?? {userId: `empty-${i}`, rank: i + 4, nickname: null, avatarUrl: null, points: null},
    )
    // 아래 내 줄 · 순위에 있으면 DB 가 준 내 줄 (10위 밖이어도 따라온다)
    //  순위에 없거나(이번 기간에 채점된 예측 없음) 아직 데이터가 없으면 "내 순위 · 0점" (닉네임 · 사진은 내 프로필)
    const me = ranking?.find((row) => row.isMe) ?? {
        rank: null,
        nickname: myProfile?.nickname ?? null,
        avatarUrl: myProfile?.avatarUrl ?? null,
        points: null,
    }

    const title = period === 'month' ? `${now.getMonth() + 1}월 적중왕` : `${now.getFullYear()} 시즌 적중왕`

    return (
        <div className="predict">
            <Header title="승부 예측" backTo="/home" />
            <PredictTabs current="rank" />

            <main className="predict__main predict-rank">
                <div className="predict-rank__period" role="tablist" aria-label="기간">
                    {PERIODS.map(({key, label}) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={period === key}
                            className="predict-rank__period-tab"
                            onClick={() => setPeriod(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* 순위가 0명이어도 빈 화면 대신 틀을 그대로 보여 준다 */}
                <RankPodium title={title} top={top} />
                <ol className="predict-rank__list">
                    {restSlots.map((row) => (
                        <RankRow key={row.userId} row={row} />
                    ))}
                </ol>
            </main>

            {/* 아래 고정 내 줄 · 순위가 없어도 항상 보인다 */}
            <RankRow row={me} bar />
        </div>
    )
}

export default PredictRank
