import {Link} from 'react-router'
import Icon from '../../../components/Icon/Icon.jsx'
import './PredictBanner.css'

/**
 * 승부 예측으로 가는 카드 · 경기마다 바뀌지 않고 항상 같은 안내
 * @param {{team?: string}} props team: 내 응원팀 코드('LG' 등) · 아직 모르면 "우리 팀"
 */
function PredictBanner({team}) {
    return (
        <Link to="/predict" className="predict-banner" aria-label="승부 예측하러 가기">
            <span className="predict-banner__text">
                <span className="predict-banner__chip">승부 예측</span>
                <span className="predict-banner__title">
                    {team ?? '우리 팀'} 오늘은
                    <br />
                    이길까요, 질까요?
                </span>
                <span className="predict-banner__go">
                    승부 예측하러 가기
                    <Icon name="chevronRight" size={15} strokeWidth={2.4} />
                </span>
            </span>
            <img className="predict-banner__char" src="/assets/rate-up.png" alt="" width="92" height="100" />
        </Link>
    )
}

export default PredictBanner
