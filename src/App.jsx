import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { onAuthChange } from './api/auth.js'
import Login from './pages/Login/Login.jsx'
import Signup from './pages/Signup/Signup.jsx'
import SignupDone from './pages/Signup/SignupDone.jsx'
import Splash from './pages/Splash/Splash.jsx'
// [메이트 추가] 모집 글 쓰기 · 상세(지금은 자리 + 완료 창) 화면
import MateWrite from './pages/Mate/MateWrite.jsx'
import MateDetail from './pages/Mate/MateDetail.jsx'

// 로그인하지 않아도 볼 수 있는 화면. 여기에 없는 주소는 모두 로그인해야 한다.
const PUBLIC_PATHS = ['/', '/login', '/signup', '/signup/done']

// 아직 만들지 않은 화면 자리 표시
function Placeholder({ title }) {
    return <div style={{padding: 24}}>{title} (준비 중)</div>
}

function App() {
    const { pathname } = useLocation()
    const [signedIn, setSignedIn] = useState(null) // null: 저장된 세션 확인 중

    useEffect(() => onAuthChange((session) => setSignedIn(!!session)), [])

    if (!PUBLIC_PATHS.includes(pathname)) {
        if (signedIn === null) return null
        if (!signedIn) return <Navigate to="/login" replace/>
    }

    return (
        <Routes>
            <Route path="/" element={<Splash/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/signup" element={<Signup/>}/>
            <Route path="/signup/done" element={<SignupDone/>}/>
            <Route path="/profile/edit" element={<Placeholder title="자기소개 작성"/>}/>
            <Route path="/home" element={<Placeholder title="홈"/>}/>
            {/* [메이트 추가] 모집 글 쓰기 · PUBLIC_PATHS에 없으므로 로그인해야 들어올 수 있다 */}
            <Route path="/mate/write" element={<MateWrite/>}/>
            {/* [메이트 추가] 모집 글 상세 · 지금은 "준비 중" 자리 + 글 올리기 완료 창 (상세 화면은 MateDetail.jsx를 채운다) */}
            <Route path="/mate/:id" element={<MateDetail/>}/>
        </Routes>
    )
}

export default App
