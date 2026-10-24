import {Link} from 'react-router'
import {Button, EmptyState, Header, Icon, Loading} from '../../components'
import {SIGNUP} from '../../constants/policy.js'
import useMyProfile from '../../hooks/useMyProfile.js'
import {formatManner, mannerSummary} from '../../utils/manner.js'
import './Mypage.css'

// 내 활동 메뉴 · 눌렀을 때 이동할 화면
const ACTIVITY_MENU = [
    {label: '내 직관 약속', to: '/my/posts'},
    {label: '메이트 평가하기', to: '/my/reviews'},
    {label: '직관 기록', to: '/record'},
]
// 계정 메뉴 · 아직 기능을 연결하지 않았다 (화면만)
const ACCOUNT_MENU = ['알림 설정', '로그아웃']

/** 메뉴 한 줄 · 이름과 오른쪽 화살표 · to 가 있으면 그 화면으로 이동하고, 없으면 눌러도 아직 아무 일도 없다 */
function MenuRow({label, to}) {
    const content = (
        <>
            <span className="mypage__row-label">{label}</span>
            <Icon name="chevronRight" size={18}/>
        </>
    )
    return to
        ? <Link to={to} className="mypage__row">{content}</Link>
        : <button type="button" className="mypage__row">{content}</button>
}

/** 마이페이지 (My.dc.html) · 내 프로필, 매너 타율, 메뉴 */
function Mypage() {
    // 내 프로필 불러오기 · status 는 loading | ready | error
    const {status, profile, reload} = useMyProfile()

    return (
        <>
            <Header large title="마이페이지"/>
            <main className="mypage">
                {/* 불러오는 중 */}
                {status === 'loading' && <Loading/>}
                {/* 불러오지 못했을 때 · 다시 시도 버튼 */}
                {status === 'error' && (
                    <EmptyState image="/assets/pose-sad.png" title="내 정보를 불러오지 못했어요"
                                description="잠시 후 다시 시도해 주세요"
                                action={<Button variant="small-outline" onClick={reload}>다시 시도</Button>}/>
                )}
                {/* 불러왔을 때 */}
                {status === 'ready' && <MypageBody profile={profile}/>}
            </main>
        </>
    )
}

/** 불러온 프로필로 그리는 본문 */
function MypageBody({profile}) {
    const {nickname, team: teamCode, avatar, manner} = profile

    // 응원팀 코드로 팀 이름('LG 트윈스' 등)을 찾는다
    const team = SIGNUP.TEAMS.find((t) => t.code === teamCode)
    // 매너 타율 카드에 쓸 값 · 구간 이름, 막대 길이, 다음 구간까지 안내
    const summary = mannerSummary(manner)

    return (
        <>
            {/* 프로필 + 매너 타율 카드 */}
            <section className="mypage__card mypage__card--profile">
                {/* 사진 · 닉네임 · 응원팀 · 프로필 수정 */}
                <div className="mypage__profile">
                    <img className="mypage__avatar" src={avatar ?? '/assets/profile-default.png'} alt="" width="512" height="512"/>
                    <div className="mypage__who">
                        <p className="mypage__name">{nickname}</p>
                        <p className="mypage__meta">{team?.name}</p>
                    </div>
                    <Button as={Link} to="/profile/edit" variant="small-outline">프로필 수정</Button>
                </div>

                {/* 매너 타율 카드 */}
                <div className="mypage__manner">
                    {/* 제목 줄 */}
                    <span className="mypage__manner-title">
                        <svg className="mypage__ball" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M7 4.5c2.2 2.2 2.2 12.8 0 15M17 4.5c-2.2 2.2-2.2 12.8 0 15"/>
                        </svg>
                        매너 타율
                        <Link to="/my/manner" className="mypage__manner-more">후기 보기<Icon name="chevronRight" size={14}
                                                                       strokeWidth={2.2}/></Link>
                    </span>
                    {/* 점수(.250 형태)와 구간 이름 */}
                    <span className="mypage__manner-score">
                        <span className="mypage__manner-num">{formatManner(manner)}</span>
                        <span className="mypage__manner-tier">{summary.label}</span>
                    </span>
                    {/* 진행 막대 · .200~.400 사이에서 지금 위치 */}
                    <span className="mypage__bar" aria-hidden="true">
                        <span style={{width: `${summary.progress * 100}%`}}/>
                    </span>
                    {/* 안내 문구 · 오른쪽은 다음 구간까지 남은 값 */}
                    <span className="mypage__manner-foot">
                        <span>함께 직관한 메이트들이 남긴 평가예요</span>
                        <span>{summary.nextText}</span>
                    </span>
                </div>
            </section>

            {/* 내 활동 메뉴 */}
            <section className="mypage__card">
                <h2 className="mypage__section">내 활동</h2>
                {ACTIVITY_MENU.map(({label, to}) => <MenuRow key={label} label={label} to={to}/>)}
            </section>

            {/* 계정 메뉴 */}
            <section className="mypage__card">
                <h2 className="mypage__section">계정</h2>
                {ACCOUNT_MENU.map((label) => <MenuRow key={label} label={label}/>)}
                <button type="button" className="mypage__row mypage__row--quiet">회원 탈퇴</button>
            </section>
        </>
    )
}

export default Mypage
