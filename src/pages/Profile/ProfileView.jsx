import {Link, useParams} from 'react-router'
import {Header, Icon, LoadState, ReviewItem} from '../../components'
import {PROFILE, REVIEW, SIGNUP} from '../../constants/policy.js'
import useProfile from '../../hooks/load/useProfile.js'
import useReceivedReviews from '../../hooks/load/useReceivedReviews.js'
import {formatManner, mannerSummary} from '../../utils/manner.js'
import './ProfileView.css'

/** 다른 사람의 프로필 · 주소의 id 로 그 사람의 프로필을 불러온다 */
function ProfileView() {
    const {id} = useParams()
    // status 는 loading | ready | error
    const {status, profile, reload} = useProfile(id)

    return (
        <div className="profile-view">
            <Header title="프로필" />
            <LoadState status={status} errorTitle="프로필을 불러오지 못했어요" onRetry={reload} />
            {status === 'ready' && <ProfileBody id={id} profile={profile} />}
        </div>
    )
}

/** 불러온 프로필로 그리는 본문 */
function ProfileBody({id, profile}) {
    const {nickname, team: teamCode, gender, age, headline, bio, avatar, manner} = profile
    // 응원팀 코드로 팀 이름('LG 트윈스' 등)을 찾는다
    const team = SIGNUP.TEAMS.find((t) => t.code === teamCode)
    const summary = mannerSummary(manner)
    // 받은 후기 · 프로필에는 최근 것만 보여 주고 전체는 따로 본다
    const {status: reviewStatus, reviews, total} = useReceivedReviews(id, REVIEW.PROFILE_PREVIEW_COUNT)

    return (
        <>
            {/* 사진 · 닉네임 · 나이대/성별/응원팀 · 한 줄 소개 · 매너 타율 */}
            <section className="profile-view__top">
                <img
                    className="profile-view__avatar"
                    src={avatar ?? PROFILE.DEFAULT_AVATAR}
                    alt=""
                    width="512"
                    height="512"
                />
                <h2 className="profile-view__name">{nickname}</h2>
                <span className="profile-view__meta">
                    {age} · {gender} · {team?.name}
                </span>
                {headline && <p className="profile-view__headline">{headline}</p>}
                <span className="profile-view__manner">
                    <svg className="profile-view__ball" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M7 4.5c2.2 2.2 2.2 12.8 0 15M17 4.5c-2.2 2.2-2.2 12.8 0 15" />
                    </svg>
                    <span className="profile-view__manner-label">매너 타율</span>
                    <strong className="profile-view__manner-num">{formatManner(manner)}</strong>
                    <span className="profile-view__manner-tier">{summary.label}</span>
                </span>
            </section>

            <main className="profile-view__body">
                {/* 자기소개 · 쓰지 않았으면 보여 주지 않는다 */}
                {bio && (
                    <section className="profile-view__section">
                        <h2 className="profile-view__title">자기소개</h2>
                        <p className="profile-view__bio">{bio}</p>
                    </section>
                )}

                {/* 받은 매너 후기 · 최근 3개와 전체보기 */}
                <section className="profile-view__card">
                    <div className="profile-view__head">
                        <h2 className="profile-view__card-title">받은 매너 후기</h2>
                        <span className="profile-view__count">{total}</span>
                        {total > 0 && (
                            <Link to={`/profile/${id}/reviews`} className="profile-view__more">
                                전체보기
                                <Icon name="chevronRight" size={16} />
                            </Link>
                        )}
                    </div>
                    {reviewStatus === 'error' && (
                        <div className="profile-view__empty">
                            <Icon name="info" size={13} />
                            후기를 불러오지 못했어요
                        </div>
                    )}
                    {reviewStatus === 'ready' && reviews.length === 0 && (
                        <div className="profile-view__empty">
                            <Icon name="info" size={13} />
                            아직 받은 매너 후기가 없어요
                        </div>
                    )}
                    {reviews.map(({id: reviewId, score, comment}) => (
                        <ReviewItem key={reviewId} score={score} comment={comment} />
                    ))}
                </section>
            </main>
        </>
    )
}

export default ProfileView
