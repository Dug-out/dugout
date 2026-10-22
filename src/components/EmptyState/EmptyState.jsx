import './EmptyState.css'

/**
 * 빈 화면 · 캐릭터 + 제목 + 설명 (Empty-*.dc.html)
 * image: 기본은 잠자는 캐릭터(empty-sleep.png). action에 Button 등을 넣으면 아래에 붙는다.
 */
function EmptyState({
                        image = '/assets/empty-sleep.png',
                        title,
                        description,
                        action,
                        className = '',
                    }) {
    const classes = ['empty', className].filter(Boolean).join(' ')

    return (
        <div className={classes}>
            <img className="empty__image" src={image} alt="" width="132" height="104"/>
            <span className="empty__title">{title}</span>
            {description && <span className="empty__desc">{description}</span>}
            {action && <div className="empty__action">{action}</div>}
        </div>
    )
}

export default EmptyState
