import {useState} from 'react'
import {Link} from 'react-router'
import {savePrediction} from '../../api/predictions.js'
import {Button, EmptyState, Header, LoadState, NoticeDialog} from '../../components'
import useCountdown from '../../hooks/useCountdown.js'
import useGameBriefing from '../../hooks/load/useGameBriefing.js'
import useGameStats from '../../hooks/load/useGameStats.js'
import useMyTeam from '../../hooks/load/useMyTeam.js'
import usePredictionGame from '../../hooks/load/usePredictionGame.js'
import {BRIEFING_FAILED, BRIEFING_LOADING, briefingText} from '../../utils/briefing.js'
import {CLOSE_BEFORE_MS, outcomeLabel, outcomeOf, teamOf} from '../../utils/predict.js'
import FanStats from './components/FanStats.jsx'
import PredictGameCard from './components/PredictGameCard.jsx'
import PredictTabs from './components/PredictTabs.jsx'
import ScoreCard from './components/ScoreCard.jsx'
import './Predict.css'

/** 승부 예측 · 예측하기 화면 (/predict) */
function Predict() {
    const myTeam = useMyTeam()
    // 🔌 getPredictionGame · 예측할 경기가 없으면 notfound
    const {status, data, reload} = usePredictionGame()

    return (
        <div className="predict">
            <Header title="승부 예측" backTo="/home" />
            <PredictTabs current="play" />

            {status === 'ready' && <PredictContent key={data.game.id} {...data} />}

            {(status === 'loading' || status === 'error') && (
                <main className="predict__main predict__main--empty">
                    <LoadState status={status} errorTitle="경기 정보를 불러오지 못했어요" onRetry={reload} />
                </main>
            )}

            {status === 'notfound' && (
                <main className="predict__main predict__main--empty">
                    <EmptyState
                        title="예측할 경기가 없어요"
                        description={
                            <>
                                다음 {myTeam ? `${teamOf(myTeam).label} ` : ''}경기 일정이 나오면
                                <br />
                                바로 예측할 수 있어요
                            </>
                        }
                        action={
                            <Button
                                as={Link}
                                to="/predict/history"
                                replace
                                variant="secondary"
                                className="predict__empty-btn"
                            >
                                지난 예측 보기
                            </Button>
                        }
                    />
                </main>
            )}
        </div>
    )
}

/**
 * 예측할 경기가 있을 때 · 경기 카드 + 스코어 카드 + 팬 비율 + 하단 버튼
 * 상태 3가지 · 입력 중 / 예측 완료 / 마감 (경기 시작 1시간 전 · 화면에서만 막는다)
 */
function PredictContent({game, myPick, record}) {
    const my = teamOf(game.myTeam)
    const opp = teamOf(game.opponent)

    // 🔌 getGameStats · 불러오는 중이거나 실패하면 팬 비율 카드만 숨긴다
    const {status: statsStatus, stats, refresh: refreshStats} = useGameStats(game.id)
    // 🔌 AI 브리핑 · 오늘 경기(없으면 이 경기)의 한 줄 브리핑과 예상 스코어 · 사용자마다 처음 받은 것으로 고정
    const {status: briefingStatus, briefing} = useGameBriefing(game.id)

    // 점수 · 아직 안 정했으면 null, 예측해 둔 것이 있으면 그 점수로 시작
    const [score, setScore] = useState({my: myPick?.my ?? null, opp: myPick?.opp ?? null})
    const [done, setDone] = useState(myPick !== null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const remainMs = useCountdown(new Date(game.gameAt).getTime() - CLOSE_BEFORE_MS)
    const closed = remainMs === 0
    const ready = score.my !== null && score.opp !== null

    const submit = async () => {
        setSaving(true)
        try {
            // 🔌 savePrediction · 저장한 뒤 팬 비율을 다시 불러와 내 예측까지 반영한다
            await savePrediction({gameId: game.id, isHome: game.isHome, my: score.my, opp: score.opp})
            setDone(true)
            refreshStats()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <main className="predict__main">
                <PredictGameCard game={game} record={record} remainMs={remainMs} />
                <ScoreCard
                    myLabel={my.label}
                    oppLabel={opp.label}
                    my={score.my}
                    opp={score.opp}
                    onChange={(nextMy, nextOpp) => setScore({my: nextMy, opp: nextOpp})}
                    locked={done || closed || saving}
                    aiText={
                        briefingStatus === 'ready'
                            ? briefingText(briefing, my.label)
                            : briefingStatus === 'loading'
                              ? BRIEFING_LOADING
                              : BRIEFING_FAILED
                    }
                />
                {statsStatus === 'ready' && <FanStats teamLabel={my.label} stats={stats} />}
            </main>

            <div className="predict__bottom">
                {done ? (
                    <div className="predict__done">
                        <div className="predict__done-row">
                            <span className="predict__done-label">
                                <span className="predict__done-check" aria-hidden="true">
                                    ✓
                                </span>
                                예측 완료
                            </span>
                            <span className="predict__done-pick">
                                {outcomeLabel(outcomeOf(score.my, score.opp), my.label)} {score.my} : {score.opp}
                            </span>
                        </div>
                        {/* 마감되면 수정할 수 없다 */}
                        {!closed && (
                            <Button variant="secondary" block className="predict__edit" onClick={() => setDone(false)}>
                                예측 수정하기
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button block disabled={closed || !ready || saving} onClick={submit}>
                        {closed
                            ? '예측이 마감됐어요'
                            : !ready
                              ? '스코어를 정해 주세요'
                              : saving
                                ? '저장하는 중…'
                                : '예측 완료하기'}
                    </Button>
                )}
            </div>

            <NoticeDialog
                open={error !== null}
                onClose={() => setError(null)}
                kind="failure"
                title="예측을 저장하지 못했어요"
                description={error}
            />
        </>
    )
}

export default Predict
