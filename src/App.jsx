import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { onAuthChange } from './api/auth.js'
import Login from './pages/Login/Login.jsx'
import Signup from './pages/Signup/Signup.jsx'
import SignupDone from './pages/Signup/SignupDone.jsx'
import Splash from './pages/Splash/Splash.jsx'
// [메이트 추가] 모집 글 목록 화면
import Mate from './pages/Mate/Mate.jsx'

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
            {/* [메이트 추가] 모집 글 목록 · PUBLIC_PATHS에 없으므로 위의 로그인 확인을 통과해야 들어올 수 있다
                탭바가 붙는 앱 틀은 다른 팀원이 만들면 그때 이 줄을 그 틀 안으로 옮긴다 */}
            <Route path="/mate" element={<Mate/>}/>
            {/* [메이트 추가] 모집 글 쓰기 · 상세 · 신청자 관리 · 다음 작업(B·C·D)에서 실제 화면으로 바꾼다
                지금은 목록의 카드·글쓰기 버튼을 눌렀을 때 빈 화면이 되지 않도록 자리만 잡아 둔다 */}
            <Route path="/mate/write" element={<Placeholder title="모집 글 쓰기"/>}/>
            <Route path="/mate/:id" element={<Placeholder title="모집 글 상세"/>}/>
            <Route path="/mate/:id/manage" element={<Placeholder title="신청자 관리"/>}/>
        </Routes>
    )
}

export default App
