import {EmptyState, Header} from '../../components'

/** 내 직관 탭 · 아직 기록 테이블이 없어 빈 화면만 보여 준다 */
function Record() {
    return (
        <>
            <Header large title="내 직관" />
            {/* "직관 기록하기" 버튼은 기록 쓰기 화면(Record-write)을 만들 때 action 으로 붙인다 */}
            <EmptyState
                title="아직 직관 기록이 없어요"
                description={
                    <>
                        첫 직관을 기록하고
                        <br />
                        나만의 직관 승률을 만들어 보세요
                    </>
                }
            />
        </>
    )
}

export default Record
