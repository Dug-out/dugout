import './Tag.css'

/**
 * 모집 조건 태그 · 좌석 / 나이대 / 성별 (눌러서 고르는 게 아니라 보여주기용)
 *  - default:  연한 회색 배경 + 남색 글자
 *  - selected: 남색 배경 + 흰 글자
 *  - dashed:   점선 테두리 (예: 성별 무관)
 */
function Tag({tone = 'default', className = '', children, ...rest}) {
    const classes = ['tag', tone !== 'default' && `tag--${tone}`, className].filter(Boolean).join(' ')

    return (
        <span className={classes} {...rest}>
            {children}
        </span>
    )
}

export default Tag
