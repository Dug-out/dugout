import {Link, Navigate, useLocation} from 'react-router'
import {Button, EmptyState, Header} from '../../components'
import {FOOD_OPTIONS, SEAT_OPTIONS, WHEN_OPTIONS} from '../../constants/planner.js'
import {teamOf} from '../../utils/predict.js'
import ConditionBar from './components/ConditionBar.jsx'
import PlanAiCard from './components/PlanAiCard.jsx'
import PlanGameCard from './components/PlanGameCard.jsx'
import './PlanResult.css'

// 옵션 값 → 보이는 글자
const labelOf = (options, value, key = 'label') => options.find((option) => option.value === value)?.[key]

/** AI 직관 플랜 · 결과 화면 (/plans/result) · 출발 화면이 만든 플랜(state.plan)을 보여 준다 */
function PlanResult() {
    const {state} = useLocation()

    // 플랜 없이 바로 들어오면(주소로 직접 등) 출발 화면으로 돌려보낸다
    if (!state?.plan) return <Navigate to="/plans" replace />

    const {conditions, plan} = state
    const {myTeam, game, ai} = plan

    return (
        <div className="plan-result">
            <Header title="AI 직관 플랜" backTo="/plans" />

            <main className="plan-result__main">
                <ConditionBar
                    items={[
                        {label: '응원팀', value: teamOf(myTeam).label, tone: 'team'},
                        {label: '언제', value: labelOf(WHEN_OPTIONS, conditions.when, 'short')},
                        {label: '좌석', value: labelOf(SEAT_OPTIONS, conditions.seat)},
                        {label: '음식', value: labelOf(FOOD_OPTIONS, conditions.food)},
                    ]}
                />

                {game ? (
                    <>
                        <h2 className="plan-result__heading">조건에 맞는 경기를 골랐어요</h2>
                        <PlanGameCard game={game} />
                        {ai && <PlanAiCard ai={ai} />}
                    </>
                ) : (
                    <EmptyState
                        className="plan-result__empty"
                        title="조건에 맞는 경기가 없어요"
                        description="일주일 안에 조건에 맞는 우리 팀 경기가 없어요"
                        action={
                            <Button as={Link} to="/home" variant="small-outline">
                                조건 바꾸기
                            </Button>
                        }
                    />
                )}
            </main>
        </div>
    )
}

export default PlanResult
