// 메이트 화면에만 쓰는 선 아이콘 · 모양은 디자인 파일(Mate-write · Mate-detail.dc.html) 그대로
// 기존 공통 Icon.jsx에 없는 모양이라 여기 따로 둔다 (기존 파일을 고치지 않기 위해).
// 쓰는 방법·모양은 기존 Icon과 똑같다: <MateIcon name="close" size={22}/>
const PATHS = {
    close: <path d="M6 6l12 12M18 6L6 18"/>, // 닫기 ✕
    camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></>, // 사진 추가
    chevronRight: <path d="M9 6l6 6-6 6"/>, // 경기 선택 버튼 오른쪽 ›
    // 상세 화면 (Mate-detail.dc.html)
    share: <><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></>, // 공유 ⬆
    seat: <><path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><path d="M4 11h16v4H4zM6 15v5M18 15v5"/></>, // 좌석 의자
}

/** name: close | camera | chevronRight | share | seat */
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
