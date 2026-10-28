import {useEffect, useState} from 'react'
import {Navigate, Route, Routes, useLocation} from 'react-router'
import {onAuthChange} from './api/auth.js'
import ChatRoom from './pages/Chat/ChatRoom.jsx'
import Home from './pages/Home/Home.jsx'
import Login from './pages/Login/Login.jsx'
import Mate from './pages/Mate/Mate.jsx'
import MateDetail from './pages/Mate/MateDetail.jsx'
import MateManage from './pages/Mate/MateManage.jsx'
import MateWrite from './pages/Mate/MateWrite.jsx'
import MyPosts from './pages/MyPosts/MyPosts.jsx'
import Plan from './pages/Plan/Plan.jsx'
import PlanResult from './pages/Plan/PlanResult.jsx'
import Predict from './pages/Predict/Predict.jsx'
import PredictHistory from './pages/Predict/PredictHistory.jsx'
import PredictRank from './pages/Predict/PredictRank.jsx'
import Signup from './pages/Signup/Signup.jsx'
import SignupDone from './pages/Signup/SignupDone.jsx'
import {TabLayout} from './components'
import MannerReviews from './pages/Reviews/Received/MannerReviews.jsx'
import Mypage from './pages/Mypage/Mypage.jsx'
import ProfileReviews from './pages/Reviews/Received/ProfileReviews.jsx'
import ReviewDone from './pages/Reviews/Give/ReviewDone.jsx'
import ReviewList from './pages/Reviews/Give/ReviewList.jsx'
import ReviewWrite from './pages/Reviews/Give/ReviewWrite.jsx'
import ProfileView from './pages/Profile/ProfileView.jsx'
import ProfileEdit from './pages/Profile/ProfileEdit.jsx'
import Splash from './pages/Splash/Splash.jsx'

// 로그인하지 않아도 볼 수 있는 화면. 여기에 없는 주소는 모두 로그인해야 한다.
const PUBLIC_PATHS = ['/', '/login', '/signup', '/signup/done']

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
            <Route path="/my/manner" element={<MannerReviews />} />
            <Route path="/my/reviews" element={<ReviewList />} />
            <Route path="/reviews/done" element={<ReviewDone />} />
            <Route path="/reviews/:postId/:userId" element={<ReviewWrite />} />
            <Route path="/profile/:id" element={<ProfileView />} />
            <Route path="/profile/:id/reviews" element={<ProfileReviews />} />
            {/* 탭바가 붙는 화면들 */}
            <Route element={<TabLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/plans" element={<Plan />} />
                <Route path="/plans/result" element={<PlanResult />} />
                <Route path="/mate" element={<Mate />} />
                <Route path="/my" element={<Mypage />} />
                <Route path="/posts" element={<MyPosts />} />
            </Route>
            <Route path="/predict" element={<Predict />} />
            <Route path="/predict/history" element={<PredictHistory />} />
            <Route path="/predict/rank" element={<PredictRank />} />
            <Route path="/mate/write" element={<MateWrite />} />
            <Route path="/mate/:id" element={<MateDetail />} />
            <Route path="/mate/:id/manage" element={<MateManage />} />
            <Route path="/chat/:id" element={<ChatRoom />} />
        </Routes>
    )
}

export default App
