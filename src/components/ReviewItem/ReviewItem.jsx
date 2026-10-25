import {REVIEW} from '../../constants/policy.js'
import './ReviewItem.css'

/** 받은 후기 한 줄 · 왼쪽에 점수 칸, 오른쪽에 한 줄 후기 (후기를 쓰지 않았으면 점수만) */
function ReviewItem({score, comment}) {
    // 표정이 좋은 점수(8점 이상)는 빨강, 나머지는 회색
    const good = REVIEW.faceFromScore(score) === 'rate-good'

    return (
        <article className="review-item">
            <span className={`review-item__score${good ? ' review-item__score--good' : ''}`}>
                <span className="review-item__num">{score}</span>
                <span className="review-item__unit">점</span>
            </span>
            {comment && <p className="review-item__comment">{comment}</p>}
        </article>
    )
}

export default ReviewItem
