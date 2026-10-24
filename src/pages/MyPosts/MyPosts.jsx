import {useState} from 'react'
import {Link} from 'react-router'
import {Button, EmptyState, Header, SegmentTabs} from '../../components'
import './MyPosts.css'

// 보기 구분 · 개수는 약속 목록이 생기면 라벨에 붙인다
const TABS = [
    {key: 'all', label: '전체'},
    {key: 'host', label: '내가 연 약속'},
    {key: 'joined', label: '참여한 약속'},
]

/** 내 직관 약속 (My-posts.dc.html) · 아직 약속 테이블이 없어 빈 화면만 보여 준다 */
function MyPosts() {
    // 고른 구분 · 목록이 생기면 이 값으로 걸러서 보여 준다
    const [tab, setTab] = useState('all')

    return (
        <div className="my-posts">
            <Header title="내 직관 약속" backTo="/my"/>
            <main className="my-posts__body">
                <SegmentTabs label="내 직관 약속 보기" tabs={TABS} value={tab} onChange={setTab}/>
                {/* 약속이 없을 때 (Empty-posts.dc.html) */}
                <EmptyState className="my-posts__empty" image="/assets/pose-sad.png"
                            title="아직 잡힌 직관 약속이 없어요"
                            description="모집 글에 참여하거나 직접 글을 올려 메이트를 모아 보세요"
                            action={<Button as={Link} to="/home" variant="small-outline">메이트 찾으러 가기</Button>}/>
            </main>
        </div>
    )
}

export default MyPosts
