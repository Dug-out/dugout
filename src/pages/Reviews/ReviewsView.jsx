import {Header, Icon, LoadState, ReviewItem} from '../../components'
import useReceivedReviews from '../../hooks/useReceivedReviews.js'
import './ReviewsView.css'

/** 받은 매너 후기 목록 · userId 가 null 이면 내 후기 */
function ReviewsView({userId, title, backTo}) {
    // status 는 loading | ready | error
    const {status, reviews, total, reload} = useReceivedReviews(userId)

    return (
        <div className="reviews-view">
            <Header title={title} backTo={backTo} />
            <LoadState status={status} errorTitle="후기를 불러오지 못했어요" onRetry={reload} />
            {status === 'ready' && (
                <main className="reviews-view__body">
                    <section className="reviews-view__card">
                        <div className="reviews-view__head">
                            <h2 className="reviews-view__title">받은 후기</h2>
                            <span className="reviews-view__count">{total}</span>
                        </div>
                        <p className="reviews-view__note">
                            <Icon name="info" size={13} />
                            누가 썼는지는 공개되지 않아요
                        </p>
                        {reviews.length === 0 ? (
                            <div className="reviews-view__empty">
                                <img src="/assets/pose-sad.png" alt="" width="520" height="520" />
                                <strong>아직 받은 매너 후기가 없어요</strong>
                                <span>
                                    메이트와 함께 직관을 다녀오면
                                    <br />
                                    메이트가 남긴 후기가 여기에 모여요
                                </span>
                            </div>
                        ) : (
                            reviews.map(({id, score, comment}) => (
                                <ReviewItem key={id} score={score} comment={comment} />
                            ))
                        )}
                    </section>
                </main>
            )}
        </div>
    )
}

export default ReviewsView
