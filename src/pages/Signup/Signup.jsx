import {useState} from 'react'
import {useNavigate} from 'react-router'
import {Button, Chip, Field, Header, InlineMessage} from '../../components'
import {checkEmail, checkNickname, signUp} from '../../api/auth.js'
import {SIGNUP} from '../../constants/policy.js'
import useAvailability from './useAvailability.js'
import './Signup.css'

// 가입 오류 → 안내 문구 (DB 트리거가 닉네임 중복 같은 마지막 검사를 한 번 더 한다)
function signUpErrorMessage(error) {
    if (/already registered/i.test(error.message)) return '이미 가입된 이메일이에요'
    if (/database error/i.test(error.message)) return '이미 사용 중인 닉네임이거나 입력값이 올바르지 않아요'
    return '가입하지 못했어요. 잠시 후 다시 시도해 주세요'
}

const AVAILABILITY = {
    email: {ok: '사용할 수 있는 이메일이에요', taken: '이미 가입된 이메일이에요'},
    nickname: {ok: '멋진 닉네임이에요!', taken: '이미 사용 중인 닉네임이에요'},
}

/** 중복 확인 결과 → Field의 status / message / hint */
function availabilityProps(kind, result) {
    if (result === 'checking') return {hint: '확인하는 중이에요…'}
    if (result === 'ok') return {status: 'ok', message: AVAILABILITY[kind].ok}
    if (result === 'taken') return {status: 'error', message: AVAILABILITY[kind].taken}
    if (result === 'failed') return {status: 'error', message: '확인하지 못했어요. 잠시 후 다시 시도해 주세요'}
    return {}
}

// 구단 색을 CSS 변수로 넘긴다 (CSS 변수는 CSSProperties 타입에 없어서 캐스팅)
const teamStyle = (color) => /** @type {import('react').CSSProperties} */ ({'--team-color': color})

/** 회원가입 · 한 화면 (이메일 → 비밀번호 → 닉네임 → 성별 · 나이대 · 응원팀) */
function Signup() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '', password: '', passwordConfirm: '', nickname: '', gender: null, age: null, team: null,
    })

    const set = (key) => (e) => setForm((prev) => ({...prev, [key]: e.target.value}))
    const pick = (key, value) => setForm((prev) => ({...prev, [key]: value}))

    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const email = form.email.trim()
    const nickname = form.nickname.trim()

    const emailValid = SIGNUP.EMAIL_RULE.test(email)
    const nicknameValid = nickname.length >= SIGNUP.NICKNAME_MIN && nickname.length <= SIGNUP.NICKNAME_MAX

    const emailResult = useAvailability(email, emailValid, checkEmail)
    const nicknameResult = useAvailability(nickname, nicknameValid, checkNickname)

    const passwordValid = SIGNUP.PASSWORD_RULE.test(form.password)
    const passwordMatch = form.passwordConfirm !== '' && form.password === form.passwordConfirm

    const canSubmit = emailResult === 'ok' && passwordValid && passwordMatch && nicknameResult === 'ok'
        && form.gender && form.age && form.team && !busy

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

                <Field id="signup-email" label="이메일" type="email" autoComplete="email" inputMode="email"
                       value={form.email} onChange={set('email')}
                       {...availabilityProps('email', emailResult)}/>

                <Field id="signup-pw" label="비밀번호" type="password" autoComplete="new-password"
                       value={form.password} onChange={set('password')}
                       hint="영문과 숫자를 섞어 8자 이상"/>

                <Field id="signup-pw2" label="비밀번호 확인" type="password" autoComplete="new-password"
                       value={form.passwordConfirm} onChange={set('passwordConfirm')}
                       {...(form.passwordConfirm === '' ? {} : passwordMatch
                           ? {status: 'ok', message: '비밀번호가 일치해요'}
                           : {status: 'error', message: '비밀번호가 일치하지 않아요'})}/>

                <Field id="signup-nick" label="닉네임" type="text" autoComplete="nickname"
                       maxLength={SIGNUP.NICKNAME_MAX} value={form.nickname} onChange={set('nickname')}
                       hint={`${SIGNUP.NICKNAME_MIN}~${SIGNUP.NICKNAME_MAX}자 · 메이트에게 보여지는 이름이에요`}
                       {...availabilityProps('nickname', nicknameResult)}/>

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

                <fieldset className="signup__group">
                    <legend>응원팀</legend>
                    <div className="signup__teams">
                        {SIGNUP.TEAMS.map((team) => (
                            <button key={team.code} type="button" className="signup__team"
                                    style={teamStyle(team.color)} aria-pressed={form.team === team.code}
                                    onClick={() => pick('team', team.code)}>
                                <span className="signup__logo">
                                    <img src={team.icon} alt="" width="240" height="240"/>
                                </span>
                                {team.label}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <div className="signup__footer">
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
