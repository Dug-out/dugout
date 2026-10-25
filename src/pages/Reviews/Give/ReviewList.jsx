import {Link} from 'react-router'
import {Button, Header, Icon, LoadState} from '../../../components'
import {PROFILE, REVIEW} from '../../../constants/policy.js'
import useMyTeam from '../../../hooks/useMyTeam.js'
import useReviewList from '../../../hooks/useReviewList.js'
import {formatDay, matchLabel} from '../../../utils/mateFormat.js'
import './ReviewList.css'

/** 메이트 평가하기 · 평가 대기(글별로 묶음)와 지난 평가 */
function ReviewList() {
    // status 는 loading | ready | error
    const {status, todos, done, reload} = useReviewList()

    return (
        <div className="review-list">
            <Header title="메이트 평가하기" backTo="/my" />
            <LoadState status={status} errorTitle="평가 목록을 불러오지 못했어요" onRetry={reload} />
            {status === 'ready' && <ReviewListBody todos={todos} done={done} />}
        </div>
    )
}

/** 불러온 목록으로 그리는 본문 */
function ReviewListBody({todos, done}) {
    // 내 응원팀 · 경기 이름을 내 팀 먼저 쓸 때 쓴다
    const myTeam = useMyTeam()

    // 평가 대기를 글별로 묶는다 (목록은 이미 경기 최근 순)
    const groups = []
    todos.forEach((todo) => {
        const last = groups[groups.length - 1]
        if (last && last.postId === todo.postId) last.items.push(todo)
        else groups.push({postId: todo.postId, postTitle: todo.postTitle, game: todo.game, items: [todo]})
    })

    return (
        <main className="review-list__body">
            {/* 평가 대기 · 경기 후 기한 안 */}
            <section className="review-list__card">
                <div className="review-list__head">
                    <h2 className="review-list__title">평가 대기</h2>
                    <span className="review-list__count">{todos.length}</span>
                </div>
                <p className="review-list__sub">경기 후 {REVIEW.DEADLINE_DAYS}일 안에 평가할 수 있어요</p>

                {todos.length === 0 && (
                    <div className="review-list__empty">
                        <img src="/assets/pose-sad.png" alt="" width="520" height="520" />
                        <strong>지금은 평가할 메이트가 없어요</strong>
                        <span>메이트와 함께 직관을 다녀오면 여기에서 평가할 수 있어요</span>
                    </div>
                )}

                {groups.map((group) => (
                    <div key={group.postId} className="review-list__group">
                        <p className="review-list__group-title">{group.postTitle}</p>
                        <p className="review-list__group-sub">
                            {formatDay(group.game.gameAt)} · {group.game.stadium}
                        </p>
                        {group.items.map((todo) => (
                            <ReviewRow
                                key={todo.userId}
                                person={todo}
                                meta={
                                    <>
                                        {formatDay(todo.game.gameAt)} {matchLabel(todo.game, myTeam)} ·{' '}
                                        <span className="review-list__left">{todo.daysLeft}일 남음</span>
                                    </>
                                }
                                action={
                                    <Button
                                        as={Link}
                                        to={`/reviews/${todo.postId}/${todo.userId}`}
                                        variant="small"
                                        aria-label={`${todo.nickname}님 평가하기`}
                                    >
                                        평가하기
                                    </Button>
                                }
                            />
                        ))}
                    </div>
                ))}
            </section>

            {/* 지난 평가 */}
            <section className="review-list__card">
                <h2 className="review-list__title">지난 평가</h2>
                {done.length === 0 && <p className="review-list__none">아직 평가한 메이트가 없어요</p>}
                {done.map((review) => (
                    <ReviewRow
                        key={review.id}
                        person={review}
                        done
                        meta={`${formatDay(review.game.gameAt)} ${review.game.stadium} · ${matchLabel(review.game, myTeam)}`}
                        comment={review.comment}
                        action={<span className="review-list__state">{review.met ? `${review.score}점` : '노쇼'}</span>}
                    />
                ))}
            </section>

            <p className="review-list__note">
                <Icon name="alert" size={14} />
                <span>함께 간 메이트를 한 명씩 평가해요. 평가는 익명으로 전달돼요.</span>
            </p>
        </main>
    )
}

/** 메이트 한 줄 · 사진(프로필 링크), 닉네임과 방장/메이트 뱃지, 경기 안내 줄, 오른쪽 action (done 이면 지난 평가라 흐리게) */
function ReviewRow({person, meta, comment, action, done = false}) {
    const {userId, nickname, avatarUrl, isHost} = person

    return (
        <div className={`review-list__row${done ? ' review-list__row--done' : ''}`}>
            <Link to={`/profile/${userId}`} className="review-list__avatar-link" aria-label={`${nickname} 프로필 보기`}>
                <img
                    className="review-list__avatar"
                    src={avatarUrl || PROFILE.DEFAULT_AVATAR}
                    alt=""
                    width="44"
                    height="44"
                />
            </Link>
            <span className="review-list__who">
                <span className="review-list__name">
                    <span className="review-list__nickname">{nickname}</span>
                    <span className={`review-list__badge${done ? ' review-list__badge--done' : ''}`}>
                        {isHost ? '방장' : '메이트'}
                    </span>
                </span>
                <span className="review-list__meta">{meta}</span>
                {comment && <span className="review-list__comment">{comment}</span>}
            </span>
            {action}
        </div>
    )
}

export default ReviewList
