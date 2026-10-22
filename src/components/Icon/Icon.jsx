// 디자인 파일(Style-guide)에서 쓰는 선 아이콘 · 색은 currentColor
const PATHS = {
    back: <path d="M15 6l-6 6 6 6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <path d="M5 12.5l4.5 4.5L19 7.5"/>,
    alert: <><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></>,
    pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></>,
    home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>,
    mate: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.6c2.6.2 4.4 2 5 5.4"/></>,
    record: <><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    trade: <><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></>,
    my: <><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5"/></>,
}

/** name: back | plus | check | alert | calendar | pin | home | mate | record | trade | my */
function Icon({name, size = 24, strokeWidth = 2, ...rest}) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
            {PATHS[name]}
        </svg>
    )
}

export default Icon
