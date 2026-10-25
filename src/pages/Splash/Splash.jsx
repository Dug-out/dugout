import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router'
import {getSession} from '../../api/auth.js'
import './Splash.css'

const SPLASH_MS = 3500
const HOME_PATH = '/home'
const LOGIN_PATH = '/login'

// CSS 변수는 CSSProperties 타입에 없어서 캐스팅한다
const splashStyle = /** @type {import('react').CSSProperties} */ ({'--splash-ms': `${SPLASH_MS}ms`})

/** 스플래시 · 3.5초 뒤 이동 (로그인돼 있으면 홈, 아니면 로그인) · 화면을 누르면 바로 이동 */
function Splash() {
    const navigate = useNavigate()
    const [target, setTarget] = useState(LOGIN_PATH)

    useEffect(() => {
        let alive = true
        // 스플래시가 보이는 동안 저장된 세션을 확인해 둔다
        const sessionCheck = getSession()
            .then(({data}) => (data.session ? HOME_PATH : LOGIN_PATH))
            .catch(() => LOGIN_PATH)
            .then((path) => {
                if (alive) setTarget(path)
                return path
            })
        const timer = setTimeout(async () => {
            const path = await sessionCheck
            if (alive) navigate(path, {replace: true})
        }, SPLASH_MS)
        return () => {
            alive = false
            clearTimeout(timer)
        }
    }, [navigate])

    return (
        <Link to={target} replace className="splash" aria-label="덕아웃 시작하기" style={splashStyle}>
            <svg
                className="splash__sparkles"
                viewBox="0 0 390 844"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
            >
                <g opacity="0.55">
                    <path className="splash__navy" d="M48 420l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
                    <path className="splash__red" d="M336 396l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
                    <path className="splash__navy" d="M318 520l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
                    <circle className="splash__red" cx="74" cy="530" r="3" />
                </g>
            </svg>

            <div className="splash__sign">
                <span className="splash__rope splash__rope--left" aria-hidden="true" />
                <span className="splash__rope splash__rope--right" aria-hidden="true" />
                <div className="splash__board">
                    <div className="splash__logo">
                        <img src="/assets/logo-base.png" alt="DUGOUT" width="318" height="106" />
                        <img
                            className="splash__flag"
                            src="/assets/logo-flag.png"
                            alt=""
                            aria-hidden="true"
                            width="318"
                            height="106"
                        />
                    </div>
                </div>
            </div>

            <div className="splash__tagline">
                <p>오늘, 같이 응원할래?</p>
                <svg width="130" height="10" viewBox="0 0 130 10" aria-hidden="true">
                    <path d="M4 7 Q55 1 126 4" fill="none" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
            </div>

            <div className="splash__field" aria-hidden="true">
                <span className="splash__ball">
                    <svg width="22" height="22" viewBox="0 0 28 28">
                        <circle cx="14" cy="14" r="13" strokeWidth="1.8" />
                        <path
                            d="M8 5.5c2.6 2.4 2.6 14.6 0 17M20 5.5c-2.6 2.4-2.6 14.6 0 17"
                            fill="none"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                </span>
                <div className="splash__peek">
                    <img src="/assets/char-peek.png" alt="" width="750" height="587" />
                </div>
            </div>

            <div className="splash__stage" aria-hidden="true">
                <span className="splash__ledge" />
                <span className="splash__stripe" />
                <svg className="splash__arc" width="100%" height="90" viewBox="0 0 390 90" preserveAspectRatio="none">
                    <path
                        d="M-10 70 Q195 10 400 70"
                        fill="none"
                        strokeWidth="2"
                        strokeDasharray="3 9"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="splash__loading">
                    <span className="splash__track">
                        <span className="splash__bar" />
                    </span>
                    <span className="splash__loading-text">경기장 입장 중…</span>
                </div>
            </div>
        </Link>
    )
}

export default Splash
