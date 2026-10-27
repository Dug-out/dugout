import {Header} from '../../components'
import useMyTeam from '../../hooks/load/useMyTeam.js'
import useWeekGameCount from '../../hooks/load/useWeekGameCount.js'
import PlannerCard from './components/PlannerCard.jsx'
import PredictBanner from './components/PredictBanner.jsx'
import './Home.css'

/** 홈 · AI 직관 플래너 + 승부 예측 카드 */
function Home() {
    // 이번 주 남은 내 팀 경기 수 · 못 불러오거나 0개면 안내를 숨긴다
    const team = useMyTeam()
    const weekCount = useWeekGameCount()

    return (
        <div className="home">
            <Header
                large
                title={<img className="home__logo" src="/assets/logo.png" alt="DUGOUT" width="108" height="36" />}
            />

            <main className="home__main">
                <div className="home__intro">
                    {team && weekCount > 0 && (
                        <span className="home__week">
                            <span className="home__week-dot" aria-hidden="true" />
                            이번 주 {team} 경기 {weekCount}개
                        </span>
                    )}
                    <h2 className="home__intro-title">
                        다음 직관, <em className="home__mark">플랜부터</em> 짜 볼까요?
                    </h2>
                </div>

                <PlannerCard />
                <PredictBanner />
            </main>
        </div>
    )
}

export default Home
