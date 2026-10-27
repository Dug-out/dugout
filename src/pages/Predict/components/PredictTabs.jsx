import {Link} from 'react-router'
import './PredictTabs.css'

// 안쪽 탭 · 글자와 주소
const TABS = [
    {key: 'play', label: '예측하기', to: '/predict'},
    {key: 'rank', label: '랭킹', to: '/predict/rank'},
    {key: 'history', label: '내 기록', to: '/predict/history'},
]

/** 승부 예측 안쪽 탭 · 예측하기 · 랭킹 · 내 기록 (current 가 지금 화면) */
function PredictTabs({current}) {
    return (
        <nav className="predict-tabs" aria-label="승부 예측 메뉴">
            {TABS.map(({key, label, to}) =>
                key === current ? (
                    <span key={key} className="predict-tabs__item" aria-current="page">
                        {label}
                    </span>
                ) : (
                    // 탭끼리 옮겨 다녀도 뒤로가기는 홈으로 가도록 기록을 바꿔 끼운다
                    <Link key={key} to={to} replace className="predict-tabs__item">
                        {label}
                    </Link>
                ),
            )}
        </nav>
    )
}

export default PredictTabs
