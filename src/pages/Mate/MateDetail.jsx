import {useState} from 'react'
import {useLocation, useNavigate} from 'react-router'
import MateCreatedDialog from './components/MateCreatedDialog.jsx'

/**
 * 모집 글 상세 · 주소 /mate/:id
 * 상세 화면은 아직 만들지 않았다 → 지금은 "준비 중" 자리 표시와 완료 창만 있다.
 * 나중에 상세 화면(Mate-detail.dc.html)을 만들 때 이 파일을 채운다. 완료 창 부분은 그대로 두면 된다.
 *
 * 완료 창: 글쓰기(MateWrite)가 저장에 성공하면 navigate(..., {state: {created: true}})로 이 화면에 온다.
 * state: 주소에는 안 보이고 화면 이동에만 실려 오는 값 → 이 값이 있을 때만 "모집 글을 올렸어요!"를 띄운다.
 */
function MateDetail() {
    const location = useLocation()
    const navigate = useNavigate()

    // 글쓰기에서 막 넘어왔으면 완료 창을 연 채로 시작
    const [createdOpen, setCreatedOpen] = useState(Boolean(location.state?.created))

    // 완료 창 닫기 · 실려 온 state도 지운다 (새로고침하거나 뒤로 갔다 와도 다시 뜨지 않게)
    const closeCreated = () => {
        setCreatedOpen(false)
        navigate(location.pathname, {replace: true, state: null})
    }

    return (
        <>
            {/* 상세 화면 자리 · App.jsx의 다른 "준비 중" 화면과 같은 모양 */}
            <div style={{padding: 24}}>모집 글 상세 (준비 중)</div>
            <MateCreatedDialog open={createdOpen} onClose={closeCreated}/>
        </>
    )
}

export default MateDetail
