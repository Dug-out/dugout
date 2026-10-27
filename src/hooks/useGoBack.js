import {useNavigate} from 'react-router'

/**
 * 뒤로가기 함수를 돌려준다 · 이전 화면이 있으면 그리로, 주소로 바로 들어왔으면 fallback 으로 이동한다.
 * @param {string} fallback 돌아갈 화면이 없을 때 갈 주소
 * @param {number} steps 몇 화면 뒤로 갈지 (기본 1) · 중간 화면을 건너뛰어야 할 때 늘린다
 */
export default function useGoBack(fallback = '/home', steps = 1) {
    const navigate = useNavigate()

    return () => {
        // history.state.idx: 이 앱에서 움직인 횟수 · steps 만큼 뒤로 갈 화면이 있어야 한다
        if (window.history.state?.idx >= steps) navigate(-steps)
        else navigate(fallback, {replace: true})
    }
}
