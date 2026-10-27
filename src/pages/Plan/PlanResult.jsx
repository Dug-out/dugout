import {EmptyState, Header} from '../../components'

/** AI 직관 플랜 · 결과 화면 (/plans/result) · 아직 만드는 중이라 빈 화면만 보여 준다 */
function PlanResult() {
    return (
        <>
            <Header title="AI 직관 플랜" backTo="/plans" />
            <EmptyState title="결과 화면을 준비 중이에요" description="곧 추천 경기를 보여 드릴게요" />
        </>
    )
}

export default PlanResult
