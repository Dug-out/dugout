// 디자인 파일(Style-guide)에서 쓰는 선 아이콘 · 색은 currentColor
const PATHS = {
    back: <path d="M15 6l-6 6 6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    alert: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5v.5" />
        </>
    ),
    calendar: (
        <>
            <rect x="3.5" y="5" width="17" height="15" rx="2" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
        </>
    ),
    pin: (
        <>
            <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
        </>
    ),
    home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
    mate: (
        <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5" />
            <circle cx="17" cy="9" r="2.8" />
            <path d="M16.5 14.6c2.6.2 4.4 2 5 5.4" />
        </>
    ),
    trade: (
        <>
            <path d="M5 8h14l-1 12H6z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </>
    ),
    my: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5" />
        </>
    ),
    chevronRight: <path d="M9 6l6 6-6 6" />,
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
        </>
    ),
    chat: <path d="M4 5h16v11H9l-5 4z" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    seat: (
        <>
            <path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
            <path d="M4 11h16v4H4zM6 15v5M18 15v5" />
        </>
    ),
    send: <path d="M4 12l16-8-6 16-2.5-6.5z" />,
    camera: (
        <>
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
        </>
    ),
    chevron: <path d="M9 5l7 7-7 7" />,
    sparkle: <path d="M12 3l1.8 5.6L19 10l-5.2 1.4L12 17l-1.8-5.6L5 10l5.2-1.4z" />,
    cloud: <path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 12.1 3.5 3.5 0 0 0 7 18z" />,
    won: (
        <>
            <path d="M4 8l3.5 10L12 11l4.5 7L20 8" />
            <path d="M3 8h18M5 11h14" />
        </>
    ),
    train: (
        <>
            <rect x="5" y="4" width="14" height="13" rx="4" />
            <path d="M5 13h14M9 17l-2 3M15 17l2 3" />
            <circle cx="9" cy="9.5" r="0.8" fill="currentColor" />
            <circle cx="15" cy="9.5" r="0.8" fill="currentColor" />
        </>
    ),
    plan: <path d="M12 3c.7 4.6 2.4 6.3 7 7-4.6.7-6.3 2.4-7 7-.7-4.6-2.4-6.3-7-7 4.6-.7 6.3-2.4 7-7z" />,
    posts: (
        <>
            <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
            <path d="M9 8.5h6M9 12h6M9 15.5h4" />
        </>
    ),
    more: (
        <>
            <circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none" />
        </>
    ),
    edit: (
        <>
            <path d="M4 20h4L19 9l-4-4L4 16z" />
            <path d="M13.5 6.5l4 4" />
        </>
    ),
    trash: (
        <>
            <path d="M4 7h16M10 11v6M14 11v6" />
            <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
        </>
    ),
    ticket: (
        <>
            <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
            <path d="M14.5 7v2M14.5 11v2M14.5 15v2" />
        </>
    ),
    external: <path d="M8 16L16 8M9.5 8H16v6.5" />,
    exit: (
        <>
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
            <path d="M10 17l-5-5 5-5M5 12h11" />
        </>
    ),
}

/** name: back | plus | check | alert | calendar | pin | home | mate | plan | posts | trade | my | chevronRight | camera | info | close | seat | chat | send | chevron | sparkle | cloud | won | train | more | exit | edit | trash | ticket | external */
function Icon({name, size = 24, strokeWidth = 2, ...rest}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...rest}
        >
            {PATHS[name]}
        </svg>
    )
}

export default Icon
