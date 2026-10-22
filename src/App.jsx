import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { onAuthChange } from './api/auth.js'
import Login from './pages/Login/Login.jsx'
import Signup from './pages/Signup/Signup.jsx'
import SignupDone from './pages/Signup/SignupDone.jsx'
import Splash from './pages/Splash/Splash.jsx'

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
        </Routes>
    )
}

export default App
