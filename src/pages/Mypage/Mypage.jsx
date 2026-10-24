import {Link} from 'react-router'
import {Button, EmptyState, Header, Icon} from '../../components'
import {SIGNUP} from '../../constants/policy.js'
import useMyProfile from '../../hooks/useMyProfile.js'
import {formatManner, mannerSummary} from './utils/manner.js'
import './Mypage.css'

// 메뉴 줄 · 아직 이동·기능을 연결하지 않았다 (화면만)
const ACTIVITY_MENU = ['내 직관 약속', '메이트 평가하기', '직관 기록']
const ACCOUNT_MENU = ['알림 설정', '로그아웃']

function MenuRow({label}) {
    return (
        <button type="button" className="mypage__row">
            <span className="mypage__row-label">{label}</span>
            <Icon name="chevronRight" size={18}/>
        </button>
    )
}

/** 마이페이지 (My.dc.html) · 내 프로필, 매너 타율, 메뉴 */
function Mypage() {
    const {status, profile, reload} = useMyProfile()

    return (
        <>
            <Header large title="마이페이지"/>
            <main className="mypage">
                {status === 'loading' && (
                    <EmptyState image="/assets/loading.png" title="내 정보를 불러오고 있어요"/>
                )}
                {status === 'error' && (
                    <EmptyState image="/assets/pose-sad.png" title="내 정보를 불러오지 못했어요"
                                description="잠시 후 다시 시도해 주세요"
                                action={<Button variant="small-outline" onClick={reload}>다시 시도</Button>}/>
                )}
                {status === 'ready' && <MypageBody profile={profile}/>}
            </main>
        </>
    )
}

function MypageBody({profile}) {
    const {nickname, age, gender, team: teamCode, manner} = profile
    const team = SIGNUP.TEAMS.find((t) => t.code === teamCode)
    const summary = mannerSummary(manner)

    return (
        <>
            {/* 프로필 + 매너 타율 카드 */}
            <section className="mypage__card mypage__card--profile">
                <div className="mypage__profile">
                    <img className="mypage__avatar" src="/assets/profile-default.png" alt="" width="512" height="512"/>
                    <div className="mypage__who">
                        <p className="mypage__name">{nickname}</p>
                        <p className="mypage__meta">{age} · {gender} · {team?.name}</p>
                    </div>
                    <Button as={Link} to="/profile/edit" variant="small-outline">프로필 수정</Button>
                </div>

                <div className="mypage__manner">
                    <span className="mypage__manner-title">
                        <svg className="mypage__ball" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M7 4.5c2.2 2.2 2.2 12.8 0 15M17 4.5c-2.2 2.2-2.2 12.8 0 15"/>
                        </svg>
                        매너 타율
                        <span className="mypage__manner-more">후기 보기<Icon name="chevronRight" size={14} strokeWidth={2.2}/></span>
                    </span>
                    <span className="mypage__manner-score">
                        <span className="mypage__manner-num">{formatManner(manner)}</span>
                        <span className="mypage__manner-tier">{summary.label}</span>
                    </span>
                    <span className="mypage__bar" aria-hidden="true">
                        <span style={{width: `${summary.progress * 100}%`}}/>
                    </span>
                    <span className="mypage__manner-foot">
                        <span>함께 직관한 메이트들이 남긴 평가예요</span>
                        <span>{summary.nextText}</span>
                    </span>
                </div>
            </section>

            <section className="mypage__card">
                <h2 className="mypage__section">내 활동</h2>
                {ACTIVITY_MENU.map((label) => <MenuRow key={label} label={label}/>)}
            </section>

            <section className="mypage__card">
                <h2 className="mypage__section">계정</h2>
                {ACCOUNT_MENU.map((label) => <MenuRow key={label} label={label}/>)}
                <button type="button" className="mypage__row mypage__row--quiet">회원 탈퇴</button>
            </section>
        </>
    )
}

export default Mypage
