import {useState} from 'react'
import {Header, LoadState} from '../../components'
import useMyProfile from '../../hooks/load/useMyProfile.js'
import useRanking from '../../hooks/load/useRanking.js'
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

    // 🔌 getRanking(period) · 같은 응원팀 1~10위 + 내 줄 · 기간을 바꾸면 새 순위가 올 때까지 이전 화면을 유지한다
    const {status, ranking, reload} = useRanking(period)
    // 🔌 getMyProfile · 내가 순위에 없을 때 아래 내 줄의 닉네임 · 사진 (실패하면 "-----" 로 둔다)
    const {profile: myProfile} = useMyProfile()

    // DB 순위표 (점수 높은 순) · 10위 밖인 내 줄은 뺀다
    const board = (ranking ?? []).filter((row) => row.rank <= 10)
    // 순위 다시 세기 · 같은 점수는 같은 순위, 다음 순위는 건너뛰지 않는다 (4, 4, 5, 6, 6)
    //  DB 는 건너뛰는 방식(1, 1, 1 → 4)이라 화면에서 점수 종류 순서로 다시 센다
    //  위 순위표에 없는 점수(10위 밖인 내 줄)는 다시 셀 수 없어서 DB 순위를 그대로 둔다
    const scores = [...new Set(board.map((row) => row.points))]
    const withRank = (row) => (scores.includes(row.points) ? {...row, rank: scores.indexOf(row.points) + 1} : row)
    const ranked = board.map(withRank)
    // 10자리 · 순서대로 앞 3명은 단상, 다음 7명은 목록 · 사람이 모자라면 빈 자리("-----" · "0점")로 채운다
    const lastRank = ranked.at(-1)?.rank ?? 0
    const slots = Array.from(
        {length: 10},
        (_, i) =>
            ranked[i] ?? {
                userId: `empty-${i}`,
                rank: lastRank + i - ranked.length + 1,
                nickname: null,
                avatarUrl: null,
                points: null,
            },
    )
    const top = slots.slice(0, 3)
    const restSlots = slots.slice(3)
    // 아래 내 줄 · 순위에 있으면 DB 가 준 내 줄 (10위 밖이어도 따라온다)
    //  순위에 없으면(이번 기간에 채점된 예측 없음) "내 순위 · 0점" (닉네임 · 사진은 내 프로필 · 사진 이름은 avatar)
    const meRow = ranking?.find((row) => row.isMe)
    const me = (meRow && withRank(meRow)) ?? {
        rank: null,
        nickname: myProfile?.nickname ?? null,
        avatarUrl: myProfile?.avatar ?? null,
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

                {status === 'ready' ? (
                    // 순위가 0명이어도 빈 화면 대신 틀을 그대로 보여 준다
                    <>
                        <RankPodium title={title} top={top} />
                        <ol className="predict-rank__list">
                            {restSlots.map((row) => (
                                <RankRow key={row.userId} row={row} />
                            ))}
                        </ol>
                    </>
                ) : (
                    // 처음 불러오는 중 · 실패
                    <div className="predict-rank__state">
                        <LoadState status={status} errorTitle="순위를 불러오지 못했어요" onRetry={reload} />
                    </div>
                )}
            </main>

            {/* 아래 고정 내 줄 · 순위가 없어도 항상 보인다 */}
            {status === 'ready' && <RankRow row={me} bar />}
        </div>
    )
}

export default PredictRank
