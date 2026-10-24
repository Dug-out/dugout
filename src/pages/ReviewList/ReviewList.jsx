import {EmptyState, Header} from '../../components'
import './ReviewList.css'

/** 메이트 평가하기 (Review-list.dc.html) · 아직 평가 테이블이 없어 빈 화면(Empty-review.dc.html)만 보여 준다 */
function ReviewList() {
    return (
        <div className="review-list">
            <Header title="메이트 평가하기" backTo="/my"/>
            <EmptyState title="지금은 평가할 메이트가 없어요"
                        description={<>메이트와 함께 직관을 다녀오면<br/>여기에서 평가할 수 있어요</>}/>
        </div>
    )
}

export default ReviewList
