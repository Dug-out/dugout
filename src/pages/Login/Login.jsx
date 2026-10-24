import {useState} from 'react'
import {Link, useNavigate} from 'react-router'
import {signIn} from '../../api/auth.js'
import {Button, Field, InlineMessage} from '../../components'
import {SIGNUP} from '../../constants/policy.js'
import './Login.css'

/** 로그인 · 이메일 + 비밀번호 */
function Login() {
    // 로그인에 성공하면 화면을 이동할 때 쓴다
    const navigate = useNavigate()

    // 입력한 값 · keep 은 "로그인 상태 유지" 체크 여부
    const [form, setForm] = useState({
        email: '', password: '', keep: true
    })

    // 입력칸마다 onChange에 사용하는 변경 함수
    const set = (key) => (e) => {
        const {type, checked, value} = e.target
        setForm((prev) => ({...prev, [key]: type === 'checkbox' ? checked : value}))
    }

    // 로그인 요청 중인지 (중복 클릭 방지)
    const [busy, setBusy] = useState(false)
    // 버튼 위에 보여줄 오류 문구
    const [error, setError] = useState('')

    // 이메일 형식이 맞고 비밀번호가 입력됐고 요청 중이 아닐 때만 로그인 버튼이 켜진다
    const emailValid = SIGNUP.EMAIL_RULE.test(form.email.trim())
    const canSubmit = emailValid && form.password !== '' && !busy

    // 로그인 버튼을 눌렀을 때 · 로그인을 요청하고, 성공하면 홈으로 이동하고 실패하면 오류 문구를 보여 준다
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!canSubmit) return
        setBusy(true)
        setError('')
        try {
            await signIn({...form, email: form.email.trim()})
            navigate('/home', {replace: true})
        } catch (err) {
            // API 가 만든 한국어 문구를 그대로 보여 준다
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <main className="login">
            <div className="login__intro">
                <div className="login__brand">
                    <img className="login__logo" src="/assets/logo.png" alt="DUGOUT" width="318" height="106"/>
                    <img className="login__peek" src="/assets/char-peek.png" alt="" width="750" height="587"/>
                </div>
                <div className="login__copy">
                    <p className="login__tagline">오늘, 같이 응원할래?</p>
                    <p className="login__sub">오늘도 같이 직관 갈 메이트가 기다리고 있어요.</p>
                </div>
            </div>

            <form className="login__form" onSubmit={handleSubmit}>
                <Field id="login-email" label="이메일" type="email" autoComplete="email" inputMode="email"
                       placeholder="가입한 이메일을 입력해 주세요"
                       value={form.email} onChange={set('email')}/>
                <Field id="login-pw" label="비밀번호" type="password" autoComplete="current-password"
                       placeholder="비밀번호를 입력해 주세요"
                       value={form.password} onChange={set('password')}/>
                {/* 로그인 상태 유지 · 체크하면 브라우저를 닫아도 로그인이 남는다 */}
                <label className="login__keep">
                    <input type="checkbox" checked={form.keep} onChange={set('keep')}/>
                    로그인 상태 유지
                </label>

                <div className="login__actions">
                    {/* 로그인 실패 문구 */}
                    {error && <InlineMessage tone="error">{error}</InlineMessage>}
                    <Button type="submit" block disabled={!canSubmit}>{busy ? '로그인하는 중…' : '로그인'}</Button>
                    <Link to="/login" className="login__forgot">비밀번호를 잊으셨나요?</Link>
                </div>
            </form>

            <p className="login__signup">
                아직 덕아웃 회원이 아니신가요?
                <Link to="/signup">회원가입</Link>
            </p>
        </main>
    )
}

export default Login
