import {useNavigate} from 'react-router'

/**
 * 뒤로가기 함수를 돌려준다 · 이전 화면이 있으면 그리로, 주소로 바로 들어왔으면 fallback 으로 이동한다.
 * @param {string} fallback 이전 화면이 없을 때 갈 주소
 */
export default function useGoBack(fallback = '/home') {
    const navigate = useNavigate()

    return () => {
        // history.state.idx: 이 앱에서 움직인 횟수 · 0이면 이전 화면이 없다
        if (window.history.state?.idx > 0) navigate(-1)
        else navigate(fallback, {replace: true})
    }
}
