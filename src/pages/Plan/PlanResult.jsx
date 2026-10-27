import {Link, Navigate, useLocation} from 'react-router'
import {Button, EmptyState, Header} from '../../components'
import {DEFAULT_ORIGIN, FOOD_OPTIONS, SEAT_OPTIONS, WHEN_OPTIONS} from '../../constants/planner.js'
import {arriveAt, endEstimate, routeLink, ticketOf} from '../../utils/plan.js'
import {formatTime} from '../../utils/mateFormat.js'
import {teamOf} from '../../utils/predict.js'
import ConditionBar from './components/ConditionBar.jsx'
import PlanAiCard from './components/PlanAiCard.jsx'
import PlanGameCard from './components/PlanGameCard.jsx'
import PlanSteps from './components/PlanSteps.jsx'
import {FoodCard, FoodEmpty, RouteCard, TicketCard} from './components/PlanStepCards.jsx'
import './PlanResult.css'

// 옵션 값 → 보이는 글자
const labelOf = (options, value, key = 'label') => options.find((option) => option.value === value)?.[key]

/** AI 직관 플랜 · 결과 화면 (/plans/result) · 출발 화면이 만든 플랜(state.plan)을 보여 준다 */
function PlanResult() {
    const {state} = useLocation()

    // 플랜 없이 바로 들어오면(주소로 직접 등) 출발 화면으로 돌려보낸다
    if (!state?.plan) return <Navigate to="/plans" replace />

    const {conditions, plan} = state
    // 출발 위치 · 지도로 고르는 화면이 생기기 전까지는 강남역
    const origin = state.origin ?? DEFAULT_ORIGIN
    const {myTeam, game, foods = [], ai} = plan

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

                        <section className="plan-result__plan" aria-label="나의 직관 플랜">
                            <div className="plan-result__plan-head">
                                <h2 className="plan-result__plan-title">나의 직관 플랜</h2>
                                <span className="plan-result__end">{endEstimate(game.gameAt)} 종료 예상</span>
                            </div>
                            <PlanSteps
                                steps={[
                                    {
                                        key: 'ticket',
                                        time: '미리',
                                        title: '티켓 예매하기',
                                        children: (
                                            <TicketCard
                                                game={game}
                                                myTeam={myTeam}
                                                seat={labelOf(SEAT_OPTIONS, conditions.seat)}
                                                ticket={ticketOf(game)}
                                            />
                                        ),
                                    },
                                    {
                                        key: 'route',
                                        title: '출발하기',
                                        children: (
                                            <RouteCard
                                                origin={origin}
                                                arriveTime={arriveAt(game.gameAt)}
                                                link={routeLink(origin, game.stadium)}
                                            />
                                        ),
                                    },
                                    {
                                        key: 'food',
                                        time: arriveAt(game.gameAt),
                                        title: '구장 도착 · 먹거리 사기',
                                        children: (
                                            <div className="plan-result__foods">
                                                {foods.length > 0 ? (
                                                    foods.map((food) => <FoodCard key={food.id} food={food} />)
                                                ) : (
                                                    <FoodEmpty />
                                                )}
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'watch',
                                        time: formatTime(game.gameAt),
                                        title: '경기 관람',
                                    },
                                ]}
                            />
                        </section>
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
