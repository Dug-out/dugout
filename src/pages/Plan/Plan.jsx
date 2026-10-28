import {useEffect, useRef, useState} from 'react'
import {useLocation, useNavigate} from 'react-router'
import {makePlan} from '../../api/plan.js'
import {Header, Icon, NoticeDialog} from '../../components'
import {DEFAULT_CONDITIONS, DEFAULT_ORIGIN} from '../../constants/planner.js'
import OriginMap from './components/OriginMap.jsx'
import PlanLoading from './components/PlanLoading.jsx'
import './Plan.css'

// 플랜 짜는 중 화면이 최소한 보이는 시간(ms) · 플랜이 더 빨리 만들어져도 이만큼은 보여 준다
const LOADING_MS = 2500

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 직관 플랜 · 출발 위치 화면 (/plans) · 출발 위치를 보여 주고(홈에서 고른 조건은 플랜 만들기에 쓴다), 플랜을 짜면 결과 화면으로 간다 */
function Plan() {
    const navigate = useNavigate()
    const {state} = useLocation()
    // 홈에서 고른 조건 · 탭바로 바로 들어오면 기본 조건
    const conditions = state?.conditions ?? DEFAULT_CONDITIONS
    // 출발 위치 · 처음엔 강남역이고, 지도에서 고르면 그 위치로 바뀐다
    const [origin, setOrigin] = useState(DEFAULT_ORIGIN)

    // 플랜을 짜는 중인지 / 실패 안내 문구
    const [making, setMaking] = useState(false)
    const [failure, setFailure] = useState('')

    // 짜는 중인 플랜 · [결과 보기]가 로딩 시간을 기다리지 않고 이 결과를 바로 쓴다
    const pending = useRef(/** @type {Promise<object> | null} */ (null))
    // 화면을 떠났는지 · 떠난 뒤에 도착한 결과로 이동하지 않게 한다
    const alive = useRef(true)
    useEffect(() => {
        alive.current = true
        return () => {
            alive.current = false
        }
    }, [])

    const goResult = (plan) => {
        if (alive.current) navigate('/plans/result', {state: {conditions, origin, plan}})
    }

    const fail = () => {
        if (!alive.current) return
        setMaking(false)
        setFailure('플랜을 짜지 못했어요. 잠시 후 다시 시도해 주세요')
    }

    // [이 위치에서 플랜 짜기] · 플랜이 만들어지고 로딩 시간이 지나면 결과 화면으로 간다
    const startMaking = () => {
        if (making) return
        setMaking(true)
        pending.current = makePlan({conditions, origin})
        Promise.all([pending.current, wait(LOADING_MS)]).then(([plan]) => goResult(plan), fail)
    }

    // [결과 보기] · 로딩 시간을 건너뛰고 플랜이 만들어지는 대로 바로 간다
    const skipLoading = () => {
        pending.current.then(goResult, fail)
    }

    if (making) return <PlanLoading ms={LOADING_MS} onSkip={skipLoading} />

    return (
        <div className="plan">
            <Header title="직관 플랜" backTo="/home" />

            <div className="plan__head">
                <h2 className="plan__title">어디서 출발하세요?</h2>
            </div>

            <OriginMap initial={DEFAULT_ORIGIN} onChange={setOrigin} />

            {/* 지금 고른 출발 위치 */}
            <div className="plan__sheet">
                <div className="plan__place">
                    <span className="plan__pin">
                        <Icon name="pin" size={18} />
                    </span>
                    <span className="plan__place-text">
                        <strong>{origin.label}</strong>
                        {origin.address && <span>{origin.address}</span>}
                    </span>
                </div>
                <button type="button" className="plan__make" onClick={startMaking}>
                    이 위치에서 플랜 짜기
                </button>
            </div>

            <NoticeDialog
                open={failure !== ''}
                onClose={() => setFailure('')}
                kind="failure"
                title="플랜을 만들지 못했어요"
                description={failure}
            />
        </div>
    )
}

export default Plan
