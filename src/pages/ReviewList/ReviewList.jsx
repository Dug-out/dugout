import {Header, Icon} from '../../components'
import './ReviewList.css'

/** 메이트 평가하기 (Review-list.dc.html) · 아직 평가 테이블이 없어 두 목록 모두 빈 상태로 보여 준다 */
function ReviewList() {
    return (
        <div className="review-list">
            <Header title="메이트 평가하기" backTo="/my"/>
            <main className="review-list__body">
                {/* 평가 대기 · 경기 후 7일 안 */}
                <section className="review-list__card">
                    <div className="review-list__head">
                        <h2 className="review-list__title">평가 대기</h2>
                        <span className="review-list__count">0</span>
                    </div>
                    <p className="review-list__sub">경기 후 7일 안에 평가할 수 있어요</p>
                    {/* 비었을 때 (Empty-review.dc.html 문구) */}
                    <div className="review-list__empty">
                        <img src="/assets/pose-sad.png" alt="" width="520" height="520"/>
                        <strong>지금은 평가할 메이트가 없어요</strong>
                        <span>메이트와 함께 직관을 다녀오면 여기에서 평가할 수 있어요</span>
                    </div>
                </section>

                {/* 지난 평가 */}
                <section className="review-list__card">
                    <h2 className="review-list__title">지난 평가</h2>
                    <p className="review-list__none">아직 평가한 메이트가 없어요</p>
                </section>

                <p className="review-list__note">
                    <Icon name="alert" size={14}/>
                    <span>함께 간 메이트를 한 명씩 평가해요. 평가는 익명으로 전달돼요.</span>
                </p>
            </main>
        </div>
    )
}

export default ReviewList
