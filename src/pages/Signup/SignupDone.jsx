import {Link, Navigate, useLocation} from 'react-router'
import {Button} from '../../components'
import {MANNER, SIGNUP} from '../../constants/policy.js'
import './SignupDone.css'

// 위에서 떨어지는 색종이 개수
const CONFETTI_COUNT = 5

// 매너 타율 .250 형태로 표시
const formatManner = (value) => value.toFixed(3).replace(/^0/, '')

/** 가입 완료 · 멤버 카드(티켓) 발급. 가입 화면에서 넘겨준 정보로 카드를 만든다 */
function SignupDone() {
    // 가입 화면이 navigate 로 넘겨준 정보
    const {state} = useLocation()

    // 주소를 직접 입력해서 들어오면 넘겨받은 정보가 없으므로 가입 화면으로 돌려보낸다
    if (!state) return <Navigate to="/signup" replace/>

    const {nickname, team: teamCode, gender, age} = state

    // 팀 이름(예: 'LG 트윈스')을 찾기 위해 응원팀 코드로 목록에서 찾는다
    const team = SIGNUP.TEAMS.find((t) => t.code === teamCode)

    // 카드에 찍을 오늘 날짜 (가입 날짜 · 카드 번호)
    const now = new Date()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')

    return (
        <div className="done">
            {/* 색종이 장식 */}
            <div className="done__confetti" aria-hidden="true">
                {Array.from({length: CONFETTI_COUNT}, (_, i) => <span key={i}/>)}
            </div>

            <div className="done__head">
                <h1>덕아웃 멤버가 되었어요!</h1>
                <p>{nickname}님만의 멤버 카드가 만들어졌어요.</p>
            </div>

            {/* 멤버 카드 · 위쪽 슬롯에서 종이가 인쇄되어 나오는 모양 */}
            <div className="done__ticket-wrap">
                <div className="done__slot" aria-hidden="true"/>
                <div className="done__paper">
                    <div className="done__ticket">
                        <div className="done__ticket-top">
                            <img src="/assets/logo.png" alt="DUGOUT" width="318" height="106"/>
                            <span className="done__no">NO. {now.getFullYear()}-{mm}{dd}</span>
                        </div>
                        <div className="done__who">
                            <span className="done__face">
                                <img src="/assets/profile-default.png" alt="" width="512" height="512"/>
                            </span>
                            <div className="done__info">
                                <div>
                                    <div className="done__label">NAME</div>
                                    <div className="done__name">{nickname}</div>
                                </div>
                                <div>
                                    <div className="done__label">MY TEAM</div>
                                    <div className="done__team">{team?.name}<span>MY</span></div>
                                </div>
                            </div>
                        </div>
                        {/* 나이대, 성별, 매너 타율 (가입 직후라 시작 값 .250) */}
                        <div className="done__stats">
                            <div>
                                <div className="done__label">AGE</div>
                                <div className="done__value">{age}</div>
                            </div>
                            <div>
                                <div className="done__label">GENDER</div>
                                <div className="done__value">{gender}</div>
                            </div>
                            <div>
                                <div className="done__label">MANNER</div>
                                <div className="done__manner">{formatManner(MANNER.START)}</div>
                            </div>
                        </div>
                        <div className="done__ticket-bottom">
                            <div className="done__barcode" aria-hidden="true"/>
                            <span>{now.getFullYear()}.{mm}.{dd} 가입</span>
                        </div>
                    </div>
                </div>
                {/* "LET'S GO!" 도장 */}
                <div className="done__stamp" aria-hidden="true">LET'S<br/>GO!</div>
            </div>

            {/* 자기소개를 작성하러 가거나, 홈으로 간다 */}
            <div className="done__actions">
                <Button as={Link} to="/profile/edit" block>자기소개 작성하러 가기</Button>
                <Button as={Link} to="/home" variant="text" block>나중에 할게요</Button>
            </div>
        </div>
    )
}

export default SignupDone
