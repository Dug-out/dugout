import {useParams} from 'react-router'
import {Button, EmptyState, Header, Icon, Loading} from '../../components'
import {SIGNUP} from '../../constants/policy.js'
import useProfile from '../../hooks/useProfile.js'
import {formatManner, mannerSummary} from '../../utils/manner.js'
import './ProfileView.css'

/** 다른 사람의 프로필 · 주소의 id 로 그 사람의 프로필을 불러온다 */
function ProfileView() {
    const {id} = useParams()
    // status 는 loading | ready | error
    const {status, profile, reload} = useProfile(id)

    return (
        <div className="profile-view">
            <Header title="프로필"/>
            {/* 불러오는 중 */}
            {status === 'loading' && <Loading/>}
            {/* 불러오지 못했을 때 · 다시 시도 버튼 */}
            {status === 'error' && (
                <EmptyState title="프로필을 불러오지 못했어요" description="잠시 후 다시 시도해 주세요"
                            action={<Button variant="small-outline" onClick={reload}>다시 시도</Button>}/>
            )}
            {status === 'ready' && <ProfileBody profile={profile}/>}
        </div>
    )
}

/** 불러온 프로필로 그리는 본문 */
function ProfileBody({profile}) {
    const {nickname, team: teamCode, gender, age, headline, bio, avatar, manner} = profile
    // 응원팀 코드로 팀 이름('LG 트윈스' 등)을 찾는다
    const team = SIGNUP.TEAMS.find((t) => t.code === teamCode)
    const summary = mannerSummary(manner)

    return (
        <>
            {/* 사진 · 닉네임 · 나이대/성별/응원팀 · 한 줄 소개 · 매너 타율 */}
            <section className="profile-view__top">
                <img className="profile-view__avatar" src={avatar ?? '/assets/profile-default.png'} alt=""
                     width="512" height="512"/>
                <h2 className="profile-view__name">{nickname}</h2>
                <span className="profile-view__meta">{age} · {gender} · {team?.name}</span>
                {headline && <p className="profile-view__headline">{headline}</p>}
                <span className="profile-view__manner">
                    <svg className="profile-view__ball" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M7 4.5c2.2 2.2 2.2 12.8 0 15M17 4.5c-2.2 2.2-2.2 12.8 0 15"/>
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

                {/* 받은 매너 후기 · 아직 후기 테이블이 없어 빈 상태만 보여 준다 */}
                <section className="profile-view__card">
                    <div className="profile-view__head">
                        <h2 className="profile-view__card-title">받은 매너 후기</h2>
                        <span className="profile-view__count">0</span>
                        {/* 후기가 생기면 여기에 "전체보기" 링크(Profile-reviews)와 최근 후기 3개를 보여 준다 */}
                    </div>
                    <div className="profile-view__empty">
                        <Icon name="info" size={13}/>아직 받은 매너 후기가 없어요
                    </div>
                </section>
            </main>
        </>
    )
}

export default ProfileView
