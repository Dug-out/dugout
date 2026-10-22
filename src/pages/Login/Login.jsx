import {useState} from 'react'
import {Link, useNavigate} from 'react-router'
import {signIn} from '../../api/auth.js'
import {Button, Field, InlineMessage} from '../../components'
import {SIGNUP} from '../../constants/policy.js'
import './Login.css'

// 로그인 오류 → 안내 문구 (이메일 / 비밀번호 중 무엇이 틀렸는지는 알려주지 않는다)
function signInErrorMessage(error) {
    if (/invalid login credentials/i.test(error.message)) return '이메일 또는 비밀번호가 올바르지 않아요'
    return '로그인하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/** 로그인 · 이메일 + 비밀번호 */
function Login() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '', password: '', keep: true
    })

    const set = (key) => (e) => setForm((prev) => ({...prev, [key]: e.target.value}))

    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const emailValid = SIGNUP.EMAIL_RULE.test(form.email.trim())

    const canSubmit = emailValid && form.password !== '' && !busy

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!canSubmit) return
        setBusy(true)
        setError('')
        const {error: signInError} = await signIn({...form, email: form.email.trim()})
        setBusy(false)
        if (signInError) {
            setError(signInErrorMessage(signInError))
            return
        }
        navigate('/home', {replace: true})
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
                <label className="login__keep">
                    <input type="checkbox" checked={form.keep}
                           onChange={(e) => setForm((prev) => ({...prev, keep: e.target.checked}))}/>
                    로그인 상태 유지
                </label>

                <div className="login__actions">
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
