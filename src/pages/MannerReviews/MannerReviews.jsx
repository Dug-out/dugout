import {Header, Icon} from '../../components'
import './MannerReviews.css'

/** 받은 매너 후기 (Manner.dc.html) · 아직 후기 테이블이 없어 빈 상태(Empty-manner.dc.html)만 보여 준다 */
function MannerReviews() {
    return (
        <div className="manner-reviews">
            <Header title="받은 매너 후기" backTo="/my"/>
            <main className="manner-reviews__body">
                <section className="manner-reviews__card">
                    <div className="manner-reviews__head">
                        <h2 className="manner-reviews__title">받은 후기</h2>
                        <span className="manner-reviews__count">0</span>
                    </div>
                    <p className="manner-reviews__note">
                        <Icon name="info" size={13}/>누가 썼는지는 공개되지 않아요
                    </p>
                    {/* 후기가 생기면 이 자리에 점수 + 한 줄 후기 목록을 보여 준다 */}
                    <div className="manner-reviews__empty">
                        <img src="/assets/pose-sad.png" alt="" width="520" height="520"/>
                        <strong>아직 받은 매너 후기가 없어요</strong>
                        <span>메이트와 함께 직관을 다녀오면<br/>메이트가 남긴 후기가 여기에 모여요</span>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default MannerReviews
