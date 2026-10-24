import {useState} from 'react'
import {useNavigate} from 'react-router'
import {Button, Chip, Field, Header, InlineMessage, TeamPicker} from '../../components'
import {checkEmail, checkNickname, signUp} from '../../api/auth.js'
import {SIGNUP} from '../../constants/policy.js'
import useAvailability from '../../hooks/useAvailability.js'
import {availabilityProps} from '../../utils/availability.js'
import './Signup.css'

// 가입 오류 → 안내 문구 (DB 트리거가 닉네임 중복 같은 마지막 검사를 한 번 더 한다)
function signUpErrorMessage(error) {
    if (/already registered/i.test(error.message)) return '이미 가입된 이메일이에요'
    if (/database error/i.test(error.message)) return '이미 사용 중인 닉네임이거나 입력값이 올바르지 않아요'
    return '가입하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/** 회원가입 · 한 화면 (이메일 → 비밀번호 → 닉네임 → 성별 · 나이대 · 응원팀) */
function Signup() {
    // 가입에 성공하면 완료 화면으로 이동할 때 쓴다
    const navigate = useNavigate()

    // 입력한 값 · gender, age, team 은 아직 고르지 않은면 null 이다
    const [form, setForm] = useState({
        email: '', password: '', passwordConfirm: '', nickname: '', gender: null, age: null, team: null,
    })

    // 글자 입력칸마다 쓰는 변경 함수 · set('email') 은 email 칸이 바뀔 때 form.email 을 갱신한다
    const set = (key) => (e) => setForm((prev) => ({...prev, [key]: e.target.value}))

    // 버튼으로 고르는 값(성별 · 나이대 · 응원팀)을 저장한다
    const pick = (key, value) => setForm((prev) => ({...prev, [key]: value}))

    // 가입 요청 중인지 (중복 클릭 방지)
    const [busy, setBusy] = useState(false)
    // 버튼 위에 보여줄 오류 문구
    const [error, setError] = useState('')

    // 앞뒤 공백을 뺀 값으로 검사하고 가입한다
    const email = form.email.trim()
    const nickname = form.nickname.trim()

    // 형식 검사 (이메일 형식, 닉네임 길이)
    const emailValid = SIGNUP.EMAIL_RULE.test(email)
    const nicknameValid = nickname.length >= SIGNUP.NICKNAME_MIN && nickname.length <= SIGNUP.NICKNAME_MAX

    // 형식이 맞으면 입력을 멈추고 0.5초 뒤 DB에 중복을 물어본다 · 결과: idle | checking | ok | taken | failed
    const passwordValid = SIGNUP.PASSWORD_RULE.test(form.password)
    const passwordMatch = form.passwordConfirm !== '' && form.password === form.passwordConfirm
    const emailResult = useAvailability(email, emailValid, checkEmail)
    const nicknameResult = useAvailability(nickname, nicknameValid, checkNickname)

    // 모든 칸이 통과하고 요청 중이 아닐 때만 가입 버튼이 켜진다
    const canSubmit = emailResult === 'ok' && passwordValid && passwordMatch && nicknameResult === 'ok'
        && form.gender && form.age && form.team && !busy

    // 가입 버튼(또는 엔터)을 눌렀을 때 · 가입을 요청하고, 성공하면 완료 화면으로 이동하고 실패하면 오류 문구를 보여 준다
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!canSubmit) return
        setBusy(true)
        setError('')
        const {error: signUpError} = await signUp({...form, email, nickname})
        setBusy(false)
        if (signUpError) {
            setError(signUpErrorMessage(signUpError))
            return
        }
        navigate('/signup/done', {
            replace: true,
            state: {nickname, team: form.team, gender: form.gender, age: form.age},
        })
    }

    return (
        <div className="signup">
            <Header title="회원가입" backTo="/login"/>

            <form className="signup__form" onSubmit={handleSubmit}>
                <div className="signup__intro">
                    <div className="signup__intro-text">
                        <p className="signup__title">반가워요!<br/>계정을 만들어요</p>
                        <p className="signup__sub">같은 팀 팬과 함께하는 즐거운 직관</p>
                    </div>
                    <img src="/assets/pose-hi.png" alt="손을 흔드는 덕아웃 캐릭터" width="520" height="520"/>
                </div>

                {/* 이메일 · 입력을 멈추면 가입된 이메일인지 자동으로 확인한다 */}
                <Field id="signup-email" label="이메일" type="email" autoComplete="email" inputMode="email"
                       value={form.email} onChange={set('email')}
                       {...availabilityProps('email', emailResult)}/>

                <Field id="signup-pw" label="비밀번호" type="password" autoComplete="new-password"
                       value={form.password} onChange={set('password')}
                       hint="영문과 숫자를 섞어 8자 이상"/>

                {/* 비밀번호 확인 · 비어 있으면 아무 문구도 없고, 입력하면 일치 여부를 보여 준다 */}
                <Field id="signup-pw2" label="비밀번호 확인" type="password" autoComplete="new-password"
                       value={form.passwordConfirm} onChange={set('passwordConfirm')}
                       {...(form.passwordConfirm === '' ? {} : passwordMatch
                           ? {status: 'ok', message: '비밀번호가 일치해요'}
                           : {status: 'error', message: '비밀번호가 일치하지 않아요'})}/>

                {/* 닉네임 · 입력을 멈추면 사용 중인 닉네임인지 자동으로 확인한다 */}
                <Field id="signup-nick" label="닉네임" type="text" autoComplete="nickname"
                       maxLength={SIGNUP.NICKNAME_MAX} value={form.nickname} onChange={set('nickname')}
                       hint={`${SIGNUP.NICKNAME_MIN}~${SIGNUP.NICKNAME_MAX}자 · 메이트에게 보여지는 이름이에요`}
                       {...availabilityProps('nickname', nicknameResult)}/>

                {/* 성별 · 하나만 고른다 */}
                <fieldset className="signup__group">
                    <legend>성별</legend>
                    <div className="signup__genders">
                        {SIGNUP.GENDERS.map((gender) => (
                            <Button key={gender} variant="segment" selected={form.gender === gender}
                                    onClick={() => pick('gender', gender)}>
                                {gender}
                            </Button>
                        ))}
                    </div>
                </fieldset>

                {/* 나이대 · 하나만 고른다 */}
                <fieldset className="signup__group">
                    <legend>나이대</legend>
                    <div className="signup__ages">
                        {SIGNUP.AGES.map((age) => (
                            <Chip key={age} variant="select" selected={form.age === age}
                                  onClick={() => pick('age', age)}>
                                {age}
                            </Chip>
                        ))}
                    </div>
                </fieldset>

                {/* 응원팀 · 고른 구단은 그 구단 색(--team-color)으로 강조된다 */}
                <fieldset className="signup__group">
                    <legend>응원팀</legend>
                    <TeamPicker value={form.team} onChange={(code) => pick('team', code)}/>
                </fieldset>

                <div className="signup__footer">
                    {/* 가입 실패 문구 */}
                    {error && <InlineMessage tone="error">{error}</InlineMessage>}
                    <Button type="submit" block disabled={!canSubmit}>
                        {busy ? '가입하는 중…' : '가입하고 시작하기'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default Signup
