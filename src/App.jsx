import {useEffect, useState} from 'react'
import {Navigate, Route, Routes, useLocation} from 'react-router'
import {onAuthChange} from './api/auth.js'
import Login from './pages/Login/Login.jsx'
import Signup from './pages/Signup/Signup.jsx'
import SignupDone from './pages/Signup/SignupDone.jsx'
import {TabLayout} from './components'
import MannerReviews from './pages/MannerReviews/MannerReviews.jsx'
import Mypage from './pages/Mypage/Mypage.jsx'
import MyPosts from './pages/MyPosts/MyPosts.jsx'
import Record from './pages/Record/Record.jsx'
import ReviewList from './pages/ReviewList/ReviewList.jsx'
import ProfileView from './pages/Profile/ProfileView.jsx'
import ProfileEdit from './pages/Profile/ProfileEdit.jsx'
import Splash from './pages/Splash/Splash.jsx'
import MateWrite from './pages/Mate/MateWrite.jsx'
import MateDetail from './pages/Mate/MateDetail.jsx'
import MateManage from './pages/Mate/MateManage.jsx'

// 로그인하지 않아도 볼 수 있는 화면. 여기에 없는 주소는 모두 로그인해야 한다.
const PUBLIC_PATHS = ['/', '/login', '/signup', '/signup/done']

// 아직 만들지 않은 화면 자리 표시
function Placeholder({title}) {
    return <div style={{padding: 24}}>{title} (준비 중)</div>
}

function App() {
    const {pathname} = useLocation()

    // null: 저장된 세션 확인 중, true: 로그인된 상태, false: 로그인되지 않은 상태
    const [signedIn, setSignedIn] = useState(null)

    // 앱이 뜰 때 한 번, 로그인 상태가 바뀔 때마다 알려 달라고 등록한다
    useEffect(() => {
        // 세션이 있으면 true, 없으면 false
        // 앱이 사라질 때 React가 불러서 구독을 끊는다
        return onAuthChange((session) => setSignedIn(!!session))
    }, [])

    if (!PUBLIC_PATHS.includes(pathname)) {
        if (signedIn === null) return null
        if (!signedIn) return <Navigate to="/login" replace />
    }

    return (
        <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup/done" element={<SignupDone />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/my/posts" element={<MyPosts />} />
            <Route path="/my/manner" element={<MannerReviews />} />
            <Route path="/my/reviews" element={<ReviewList />} />
            <Route path="/profile/:id" element={<ProfileView />} />
            {/* 탭바가 붙는 화면들 */}
            <Route element={<TabLayout />}>
                <Route path="/home" element={<Placeholder title="홈" />} />
                <Route path="/my" element={<Mypage />} />
                <Route path="/record" element={<Record />} />
            </Route>
            <Route path="/mate/write" element={<MateWrite />} />
            <Route path="/mate/:id" element={<MateDetail />} />
            <Route path="/mate/:id/manage" element={<MateManage />} />
        </Routes>
    )
}

export default App
