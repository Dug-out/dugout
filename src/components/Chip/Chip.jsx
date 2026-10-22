import './Chip.css'

/**
 * variant
 *  - filter: 필터·정렬 칩 (32px, 선택 시 text-900)
 *  - select: 선택 칩 · 나이대 / 좌석 / 응원팀 (38px, 선택 시 navy-500)
 *  - label:  출처·종류 칩 (radius 6) — tone: navy | outline
 *  - badge:  상태 배지 — tone: win | lose | open | closed | dday | tier
 *
 * onClick을 넘기면 <button>, 아니면 <span>으로 렌더링한다.
 * selected는 filter / select에서만 쓴다.
 */
function Chip({
                  variant = 'filter',
                  tone,
                  selected = false,
                  onClick,
                  className = '',
                  children,
                  ...rest
              }) {
    const interactive = typeof onClick === 'function'
    const Component = interactive ? 'button' : 'span'

    const classes = [
        'chip',
        `chip--${variant}`,
        tone && `chip--${tone}`,
        selected && 'chip--selected',
        interactive && 'chip--interactive',
        className,
    ]
        .filter(Boolean)
        .join(' ')

    const props = interactive
        ? {type: 'button', onClick, 'aria-pressed': selected}
        : {}

    return (
        <Component className={classes} {...props} {...rest}>
            {children}
        </Component>
    )
}

export default Chip
