import {EmptyState, Header} from '../../components'

/** "플랜" 탭 · 저장 기능을 없애서 지금은 빈 화면만 보여 준다 */
function MyPlans() {
    return (
        <>
            <Header large title="내 플랜" />
            <EmptyState title="아직 준비 중이에요" description="곧 직관 플랜을 만나볼 수 있어요" />
        </>
    )
}

export default MyPlans
