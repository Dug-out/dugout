import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'
import {deleteSavedPlans, dday, fetchSavedPlans, updateChecklist} from '../../api/planner.js'
import {fetchMyProfile} from '../../api/profile.js'
import {Button, Dialog, EmptyState, Header, TabBar} from '../../components'
import Icon from '../../components/Icon/Icon.jsx'
import {PREP_ITEMS} from '../../constants/planner.js'
import {SIGNUP} from '../../constants/policy.js'
import './MyPlans.css'

const teamName = (code) => SIGNUP.TEAMS.find((t) => t.code === code)?.name ?? code

function PlanItem({plan, selecting, selected, onToggleSelect, onToggleChecklist, onDelete, onCreateMeetup}) {
    const game = plan.games
    const doneCount = PREP_ITEMS.filter((item) => plan.checklist?.[item.key]).length

    if (!game) {
        return (
            <li className="plan-item">
                <span className="plan-item__missing">경기 정보를 찾을 수 없어요 (더미 데이터가 바뀌었을 수 있어요)</span>
            </li>
        )
    }

    const weekday = new Date(`${game.game_date}T00:00:00`).toLocaleDateString('ko-KR', {weekday: 'long'})
    const [mm, dd] = game.game_date.slice(5).split('-')

    return (
        <li className={`plan-item ${selected ? 'plan-item--selected' : ''}`}>
            <div className="plan-item__top">
                {selecting && (
                    <button type="button" className={`plan-item__check ${selected ? 'plan-item__check--on' : ''}`}
                            aria-pressed={selected} aria-label="플랜 선택" onClick={() => onToggleSelect(plan.id)}>
                        {selected && <Icon name="check" size={13}/>}
                    </button>
                )}
                <div className="plan-item__dday">
                    <span className="plan-item__weekday">{weekday}</span>
                    <span className="plan-item__date">{mm}.{dd}</span>
                    <span className="plan-item__d">{dday(game.game_date)}</span>
                </div>
                <div className="plan-item__info">
                    <span className="plan-item__title">{teamName(game.home_team)} vs {teamName(game.away_team)} · {game.stadiums?.name} {game.start_time?.slice(0, 5)}</span>
                    <span className="plan-item__sub">{plan.seat_zone} · {plan.companion_type} · {plan.budget_tier}</span>
                </div>
                {!selecting && (
                    <button type="button" className="plan-item__delete" onClick={() => onDelete(plan)}>삭제</button>
                )}
            </div>
            <div className="plan-item__divider"/>
            <div className="plan-item__prep">
                <span>직관 준비</span>
                <span className="plan-item__prep-count">{doneCount} / 4 완료</span>
            </div>
            <div className="plan-item__chips">
                {PREP_ITEMS.map((item) => {
                    const done = !!plan.checklist?.[item.key]
                    return (
                        <button key={item.key} type="button" className={`prep-chip ${done ? 'prep-chip--done' : ''}`}
                                disabled={selecting} onClick={() => onToggleChecklist(plan, item.key, !done)}>
                            {done && <Icon name="check" size={12}/>}{item.label}
                        </button>
                    )
                })}
            </div>
            {!selecting && (
                <Button variant="small-outline" block onClick={() => onCreateMeetup(plan)}>
                    <Icon name="plus" size={14}/> 이 플랜으로 모임 만들기
                </Button>
            )}
        </li>
    )
}

/** "플랜" 탭 · AI 직관 플래너로 저장한 플랜 전체 목록 · 선택 삭제 · 모임 만들기 진입점 */
function MyPlans() {
    const navigate = useNavigate()
    const [plans, setPlans] = useState(null)
    const [error, setError] = useState('')
    const [selecting, setSelecting] = useState(false)
    const [selectedIds, setSelectedIds] = useState([])
    const [confirmTarget, setConfirmTarget] = useState(null) // {ids: string[], count: number}

    useEffect(() => {
        let alive = true
        fetchMyProfile()
            .then((profile) => fetchSavedPlans(profile.id))
            .then((data) => { if (alive) setPlans(data) })
            .catch((e) => { if (alive) setError(e.message) })
        return () => { alive = false }
    }, [])

    const toggleChecklist = async (plan, key, value) => {
        const checklist = {...plan.checklist, [key]: value}
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? {...p, checklist} : p)))
        try {
            await updateChecklist(plan.id, checklist)
        } catch (e) {
            console.error(e)
        }
    }

    const createMeetupFromPlan = (plan) => {
        const game = plan.games
        if (!game) return
        navigate('/mate/write', {
            state: {
                gameId: game.id,
                date: `${game.game_date.slice(5).replace('-', '.')}(${game.start_time.slice(0, 5)})`,
                seat: plan.seat_zone,
                budget: plan.budget_tier,
            },
        })
    }

    const toggleSelecting = () => {
        setSelecting((prev) => !prev)
        setSelectedIds([])
    }

    const toggleSelect = (planId) => {
        setSelectedIds((prev) => (prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]))
    }

    const toggleSelectAll = () => {
        setSelectedIds((prev) => (prev.length === plans.length ? [] : plans.map((p) => p.id)))
    }

    const runDelete = async () => {
        const {ids} = confirmTarget
        setConfirmTarget(null)
        try {
            await deleteSavedPlans(ids)
            setPlans((prev) => prev.filter((p) => !ids.includes(p.id)))
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
            if (selecting && ids.length > 1) setSelecting(false)
        } catch (e) {
            setError(e.message)
        }
    }

    return (
        <div className="myplans">
            <Header large title="내 플랜" right={
                <button type="button" className="myplans__write" aria-label="모임 만들기" onClick={() => navigate('/mate/write')}>
                    <Icon name="plus"/>
                </button>
            }/>

            <main className="myplans__main">
                {error && <p className="myplans__error">{error}</p>}
                {!error && plans === null && <p className="myplans__loading">불러오는 중…</p>}

                {!error && plans?.length === 0 && (
                    <EmptyState
                        title="아직 저장한 플랜이 없어요"
                        description="조건만 고르면 AI가 경기를 추천해줘요"
                        action={<Button variant="secondary" onClick={() => navigate('/home')}>AI 직관 플랜 짜기</Button>}
                    />
                )}

                {plans?.length > 0 && (
                    <>
                        <div className="myplans__toolbar">
                            {selecting ? (
                                <>
                                    <button type="button" className="myplans__link" onClick={toggleSelectAll}>
                                        {selectedIds.length === plans.length ? '전체 해제' : '전체 선택'}
                                    </button>
                                    <button type="button" className="myplans__link" onClick={toggleSelecting}>취소</button>
                                </>
                            ) : (
                                <button type="button" className="myplans__link" onClick={toggleSelecting}>선택</button>
                            )}
                        </div>

                        <ul className="plan-list">
                            {plans.map((plan) => (
                                <PlanItem key={plan.id} plan={plan} selecting={selecting}
                                          selected={selectedIds.includes(plan.id)}
                                          onToggleSelect={toggleSelect}
                                          onToggleChecklist={toggleChecklist}
                                          onDelete={(p) => setConfirmTarget({ids: [p.id], count: 1})}
                                          onCreateMeetup={createMeetupFromPlan}/>
                            ))}
                        </ul>
                    </>
                )}
            </main>

            <div className="myplans__dock">
                {selecting && selectedIds.length > 0 && (
                    <div className="myplans__bottom">
                        <Button variant="danger" block onClick={() => setConfirmTarget({ids: selectedIds, count: selectedIds.length})}>
                            선택한 {selectedIds.length}개 삭제
                        </Button>
                    </div>
                )}
                <TabBar/>
            </div>

            <Dialog
                open={!!confirmTarget}
                onClose={() => setConfirmTarget(null)}
                onConfirm={runDelete}
                title={`플랜 ${confirmTarget?.count ?? ''}개를 삭제할까요?`}
                description="삭제하면 되돌릴 수 없어요"
                confirmLabel="삭제"
            />
        </div>
    )
}

export default MyPlans
