import {useState} from 'react'
import {useNavigate, useParams} from 'react-router'
import {createReview} from '../../../api/mateReviews.js'
import {Button, Dialog, Field, Header, Icon, LoadState} from '../../../components'
import {PROFILE, REVIEW} from '../../../constants/policy.js'
import useMyTeam from '../../../hooks/useMyTeam.js'
import useReviewTarget from '../../../hooks/load/useReviewTarget.js'
import {formatDay, matchLabel} from '../../../utils/mateFormat.js'
import './ReviewWrite.css'

// 만났는지 고르는 버튼
const CHOICES = [
    {met: true, label: '만났어요'},
    {met: false, label: '상대가 안 왔어요'},
]

/** 메이트 평가하기 · 만났는지 고르고, 만났으면 점수와 한 줄 후기, 안 왔으면(노쇼) 한 줄 후기를 남긴다 */
function ReviewWrite() {
    const {postId, userId} = useParams()
    // status 는 loading | ready | error | notfound
    const {status, target, reload} = useReviewTarget(postId, userId)

    return (
        <div className="review-write">
            <Header title="메이트 평가" backTo="/my/reviews" />
            <LoadState
                status={status}
                errorTitle="평가 정보를 불러오지 못했어요"
                onRetry={reload}
                notFound={{
                    title: '평가할 수 없는 메이트예요',
                    description: `이미 평가했거나 평가 기간(경기 후 ${REVIEW.DEADLINE_DAYS}일)이 지났어요`,
                    backTo: '/my/reviews',
                    backLabel: '평가 목록으로',
                }}
            />
            {status === 'ready' && <ReviewForm target={target} />}
        </div>
    )
}

/** 불러온 메이트에 대한 평가 입력 */
function ReviewForm({target}) {
    const navigate = useNavigate()
    // 내 응원팀 · 경기 이름을 내 팀 먼저 쓸 때 쓴다
    const myTeam = useMyTeam()

    // 만났는지 / 점수 / 한 줄 후기
    const [met, setMet] = useState(true)
    const [score, setScore] = useState(REVIEW.DEFAULT_SCORE)
    const [comment, setComment] = useState('')

    // 보내는 중인지 (중복 클릭 방지) / 실패 안내 문구
    const [busy, setBusy] = useState(false)
    const [failure, setFailure] = useState('')

    // 지금 보여 줄 점수와 표정 (노쇼는 0점)
    const shownScore = met ? score : REVIEW.NOSHOW_SCORE
    const face = REVIEW.faceFromScore(shownScore)

    // [평가 보내기] · 성공하면 완료 화면으로, 실패하면 안내 카드를 띄운다
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (busy) return
        setBusy(true)
        try {
            await createReview({
                postId: target.postId,
                revieweeId: target.userId,
                met,
                score: shownScore,
                comment,
            })
            navigate('/reviews/done', {replace: true, state: {done: true}})
        } catch (err) {
            // API 가 만든 한국어 문구를 그대로 보여 준다
            setFailure(err.message)
            setBusy(false)
        }
    }

    return (
        <form className="review-write__form" onSubmit={handleSubmit}>
            <main className="review-write__body">
                {/* 평가할 메이트 */}
                <div className="review-write__who">
                    <img src={target.avatarUrl || PROFILE.DEFAULT_AVATAR} alt="" width="48" height="48" />
                    <span className="review-write__info">
                        <span className="review-write__nickname">{target.nickname}</span>
                        <span className="review-write__game">
                            {formatDay(target.game.gameAt)} {target.game.stadium} · {matchLabel(target.game, myTeam)}
                        </span>
                    </span>
                </div>

                {/* 만났는지 */}
                <section className="review-write__section">
                    <h2 className="review-write__heading">실제로 만났나요?</h2>
                    <div className="review-write__choices" role="radiogroup" aria-label="만남 여부">
                        {CHOICES.map((choice) => (
                            <button
                                key={choice.label}
                                type="button"
                                role="radio"
                                aria-checked={met === choice.met}
                                className="review-write__choice"
                                onClick={() => setMet(choice.met)}
                            >
                                {choice.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 점수 · 노쇼는 0점으로 고정되어 슬라이더가 없다 */}
                <section className="review-write__section">
                    <h2 className="review-write__ask">
                        {target.nickname}님과의 직관,
                        <br />몇 점인가요?
                    </h2>
                    <div className="review-write__score">
                        <img src={`/assets/${face}.png`} alt="" width="260" height="260" />
                        <span className="review-write__number">{shownScore}</span>
                        <span className="review-write__unit">점</span>
                    </div>
                    {met && (
                        <div className="review-write__range-wrap">
                            <input
                                className="review-write__range"
                                type="range"
                                min={REVIEW.SCORE_MIN}
                                max={REVIEW.SCORE_MAX}
                                step="1"
                                value={score}
                                aria-label={`점수 ${REVIEW.SCORE_MIN}점부터 ${REVIEW.SCORE_MAX}점`}
                                onChange={(e) => setScore(Number(e.target.value))}
                            />
                            <div className="review-write__ticks" aria-hidden="true">
                                {Array.from({length: REVIEW.SCORE_MAX}, (_, i) => (
                                    <span key={i + 1}>{i + 1}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {!met && <p className="review-write__noshow">노쇼로 접수되면 상대의 매너 타율이 내려가요.</p>}

                {/* 한 줄 후기 · 만났어도 안 왔어도 쓸 수 있다 */}
                <Field
                    id="review-comment"
                    label="한 줄 후기"
                    multiline
                    counter
                    rows={2}
                    maxLength={REVIEW.COMMENT_MAX}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                        met
                            ? '예) 시간 약속 잘 지키시고 응원도 정말 열정적이에요!'
                            : '예) 약속 장소에서 한 시간을 기다렸지만 연락이 없었어요.'
                    }
                />
                <p className="review-write__note">
                    <Icon name="info" size={13} />
                    <span>누가 썼는지는 공개되지 않아요. 점수와 후기는 상대 프로필에 보여요.</span>
                </p>
            </main>

            <div className="review-write__bottom">
                <Button type="submit" block disabled={busy}>
                    {busy ? '보내는 중…' : '평가 보내기'}
                </Button>
            </div>

            {/* 평가 실패 */}
            <Dialog
                open={failure !== ''}
                onClose={() => setFailure('')}
                onConfirm={() => setFailure('')}
                image="/assets/pose-sad.png"
                title="평가하지 못했어요"
                description={failure}
                confirmLabel="확인"
                cancelLabel={null}
                tone="primary"
            />
        </form>
    )
}

export default ReviewWrite
