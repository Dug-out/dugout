import {useState} from 'react'
import {EmptyState, Header, SegmentTabs} from '../../components'
import './Record.css'

// 보기 구분 · 기록은 경기 목록, 통계는 상대팀별 승률
const TABS = [
    {key: 'list', label: '기록'},
    {key: 'stats', label: '통계'},
]

/** 직관 기록 (Record.dc.html) · 아직 기록 테이블이 없어 승률 0과 빈 화면만 보여 준다 */
function Record() {
    // 고른 구분 · 기록이 생기면 이 값에 따라 경기 목록 또는 상대팀별 승률을 보여 준다
    const [tab, setTab] = useState('list')

    return (
        <>
            <Header large title="직관 기록"/>
            <main className="record">
                {/* 올 시즌 직관 승률 카드 */}
                <section className="record__card" aria-label="직관 승률">
                    <span className="record__card-title">직관 승률</span>
                    <span className="record__rate">.000</span>
                    <span className="record__bar" aria-hidden="true"/>
                    <span className="record__foot">
                        <span>0승</span>
                        <span>0경기</span>
                        <span>0패</span>
                    </span>
                </section>

                <SegmentTabs label="직관 기록 보기" tabs={TABS} value={tab} onChange={setTab}/>

                {/* 기록이 없을 때 (Empty-record.dc.html) · 기록 · 통계 둘 다 같은 안내 */}
                <EmptyState className="record__empty" image="/assets/pose-cheer.png"
                            title="아직 직관 기록이 없어요"
                            description="메이트와 함께 간 경기는 자동으로 기록돼요"/>
            </main>
        </>
    )
}

export default Record
