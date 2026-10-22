import {Link, Navigate, useLocation} from 'react-router'
import {Button} from '../../components'
import {MANNER, SIGNUP} from '../../constants/policy.js'
import './SignupDone.css'

const CONFETTI_COUNT = 5

// 매너 타율 .250 형태로 표시
const formatManner = (value) => value.toFixed(3).replace(/^0/, '')

/** 가입 완료 · 멤버 카드(티켓) 발급. 가입 화면에서 넘겨준 정보로 카드를 만든다 */
function SignupDone() {
    const {state} = useLocation()

    if (!state) return <Navigate to="/signup" replace/>

    const {nickname, team: teamCode, gender, age} = state

    const team = SIGNUP.TEAMS.find((t) => t.code === teamCode)
    const now = new Date()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')

    return (
        <div className="done">
            <div className="done__confetti" aria-hidden="true">
                {Array.from({length: CONFETTI_COUNT}, (_, i) => <span key={i}/>)}
            </div>

            <div className="done__head">
                <h1>덕아웃 멤버가 되었어요!</h1>
                <p>{nickname}님만의 멤버 카드가 만들어졌어요.</p>
            </div>

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
                <div className="done__stamp" aria-hidden="true">LET'S<br/>GO!</div>
            </div>

            <div className="done__actions">
                <Button as={Link} to="/profile/edit" block>자기소개 작성하러 가기</Button>
                <Button as={Link} to="/home" variant="text" block>나중에 할게요</Button>
            </div>
        </div>
    )
}

export default SignupDone
