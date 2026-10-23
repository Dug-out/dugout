// 메이트 찾기 화면에만 쓰는 선 아이콘
// 기존 공통 Icon.jsx에 없는 모양이라 여기 따로 둔다 (기존 파일을 고치지 않기 위해).
// 쓰는 방법·모양은 기존 Icon과 똑같다: <MateIcon name="chevronDown" size={16}/>
// 나중에 팀에서 공통 Icon에 합치기로 하면 PATHS 내용만 옮기면 된다.
const PATHS = {
    chevronDown: <path d="M6 9l6 6 6-6"/>, // 날짜 버튼 오른쪽 ∨
    chevronLeft: <path d="M15 6l-6 6 6 6"/>, // 달력 이전 달 <
    chevronRight: <path d="M9 6l6 6-6 6"/>, // 달력 다음 달 >
}

/** name: chevronDown | chevronLeft | chevronRight */
function MateIcon({name, size = 24, strokeWidth = 2, ...rest}) {
    return (
        // aria-hidden: 꾸밈 아이콘이라 화면 읽기 프로그램이 읽지 않게 한다 (버튼 이름은 aria-label로 따로)
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
            {PATHS[name]}
        </svg>
    )
}

export default MateIcon
