import {useState} from 'react'
import {Link} from 'react-router'
import {Button, EmptyState, Header, LoadState} from '../../components'
import useMyPredictions from '../../hooks/load/useMyPredictions.js'
import usePredictionSummary from '../../hooks/load/usePredictionSummary.js'
import HistoryRow from './components/HistoryRow.jsx'
import HistorySummary from './components/HistorySummary.jsx'
import PredictTabs from './components/PredictTabs.jsx'
import './Predict.css'
import './PredictHistory.css'

/** 승부 예측 · 내 기록 화면 (/predict/history) · 누적 점수 카드 + 예측 내역 */
function PredictHistory() {
    // 월 · 연도 글자를 정하는 지금 시각 · 한 번만 정한다
    const [now] = useState(() => new Date())

    // 🔌 getPredictionSummary · 이번 달 · 시즌 점수와 순위
    const summaryLoad = usePredictionSummary()
    // 🔌 getMyPredictions · 최근 경기부터
    const picksLoad = useMyPredictions()
    const {summary} = summaryLoad
    const {picks} = picksLoad

    // 둘 중 하나라도 실패하면 오류, 하나라도 불러오는 중이면 로딩
    const statuses = [summaryLoad.status, picksLoad.status]
    const status = statuses.includes('error') ? 'error' : statuses.includes('loading') ? 'loading' : 'ready'
    const retry = () => {
        summaryLoad.reload()
        picksLoad.reload()
    }

    return (
        <div className="predict">
            <Header title="승부 예측" backTo="/home" />
            <PredictTabs current="history" />

            {status !== 'ready' ? (
                <main className="predict__main predict__main--empty">
                    <LoadState status={status} errorTitle="기록을 불러오지 못했어요" onRetry={retry} />
                </main>
            ) : picks.length > 0 ? (
                <main className="predict__main predict-history">
                    <HistorySummary summary={summary} now={now} />

                    <section className="predict-history__list-wrap">
                        <h2 className="predict-history__title">예측 내역</h2>
                        <ul className="predict-history__list">
                            {picks.map((pick) => (
                                <HistoryRow key={pick.id} pick={pick} />
                            ))}
                        </ul>
                    </section>
                </main>
            ) : (
                // 예측한 경기가 없을 때 · 디자인이 없어 Empty-predict 틀을 따른다
                <main className="predict__main predict__main--empty">
                    <EmptyState
                        title="아직 예측한 경기가 없어요"
                        description="경기 스코어를 예측하고 점수를 모아 보세요"
                        action={
                            <Button as={Link} to="/predict" replace variant="secondary" className="predict__empty-btn">
                                예측하러 가기
                            </Button>
                        }
                    />
                </main>
            )}
        </div>
    )
}

export default PredictHistory
