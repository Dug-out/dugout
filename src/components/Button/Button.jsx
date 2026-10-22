import './Button.css'

/**
 * variant
 *  - primary:       54px · 화면 하단 주요 행동 (한 화면에 하나)
 *  - secondary:     48px · 보조 행동 (outline)
 *  - danger:        48px · 되돌릴 수 없는 행동
 *  - small:         36px · 목록 안 행동 (남색 채움)
 *  - small-outline: 36px · 목록 안 보조 행동
 *  - text:          13px · 로그아웃, 더보기
 *  - segment:       48px · 기록/통계 전환, 성별 선택 (selected로 선택 표시)
 * block: 가로 전체 너비
 * as: 링크로 쓰려면 라우터 Link 등을 넘긴다
 * disabled: Primary는 회색 배경, 나머지는 흐리게
 * @param {{as?: import('react').ElementType, [prop: string]: any}} props
 */
function Button({
                    variant = 'primary',
                    block = false,
                    selected,
                    as: Component = 'button',
                    disabled = false,
                    className = '',
                    children,
                    ...rest
                }) {
    const classes = ['btn', `btn--${variant}`, block && 'btn--block', selected && 'btn--selected', className]
        .filter(Boolean)
        .join(' ')

    const props = Component === 'button'
        ? {type: 'button', disabled}
        : {'aria-disabled': disabled || undefined}
    if (variant === 'segment') props['aria-pressed'] = !!selected

    return (
        <Component className={classes} {...props} {...rest}>
            {children}
        </Component>
    )
}

export default Button
