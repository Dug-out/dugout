import {EmptyState, Header} from '../../components'

/** "플랜" 탭 · AI 직관 플랜을 새로 만들기 전까지 빈 화면만 보여 준다 */
function Plan() {
    return (
        <>
            <Header large title="AI 직관 플랜" />
            <EmptyState title="아직 준비 중이에요" description="곧 직관 플랜을 만나볼 수 있어요" />
        </>
    )
}

export default Plan
