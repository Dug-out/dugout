import {Header} from '../../components'
import PlannerCard from './components/PlannerCard.jsx'
import PredictBanner from './components/PredictBanner.jsx'
import './Home.css'

/** 홈 · 직관 플래너 + 승부 예측 카드 */
function Home() {
    return (
        <div className="home">
            <Header
                large
                title={<img className="home__logo" src="/assets/logo.png" alt="DUGOUT" width="108" height="36" />}
            />

            <main className="home__main">
                <div className="home__intro">
                    <span className="home__tagline">
                        <span className="home__tagline-dot" aria-hidden="true" />
                        오늘, 같이 응원할래?
                    </span>
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
