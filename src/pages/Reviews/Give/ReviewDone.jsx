import {Link, Navigate, useLocation} from 'react-router'
import {Button} from '../../../components'
import './ReviewDone.css'

// 위에서 떨어지는 색종이 개수
const CONFETTI_COUNT = 5

/** 평가 완료 · 평가 화면이 넘겨준 표시가 없으면(주소 직접 입력) 목록으로 돌려보낸다 */
function ReviewDone() {
    const {state} = useLocation()
    if (!state?.done) return <Navigate to="/my/reviews" replace />

    return (
        <div className="review-done">
            <div className="review-done__confetti" aria-hidden="true">
                {Array.from({length: CONFETTI_COUNT}, (_, i) => (
                    <span key={i} />
                ))}
            </div>
            <div className="review-done__center">
                <img src="/assets/pose-yay.png" alt="" width="520" height="520" />
                <h1>평가가 전달됐어요!</h1>
                <p>
                    소중한 평가 덕분에
                    <br />더 믿을 수 있는 덕아웃이 돼요.
                </p>
            </div>
            <div className="review-done__bottom">
                <Button as={Link} to="/my/reviews" replace block>
                    확인
                </Button>
            </div>
        </div>
    )
}

export default ReviewDone
