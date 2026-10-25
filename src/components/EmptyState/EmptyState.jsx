import './EmptyState.css'

/**
 * 빈 화면 · 캐릭터 + 제목 + 설명
 * image: 기본은 눈물 캐릭터(pose-sad.png) · description 은 줄바꿈이 필요하면 <br/> 를 넣은 JSX 로 넘긴다. action에 Button 등을 넣으면 아래에 붙는다.
 */
function EmptyState({
                        image = '/assets/pose-sad.png',
                        title,
                        description,
                        action,
                        className = '',
                    }) {
    const classes = ['empty', className].filter(Boolean).join(' ')

    return (
        <div className={classes}>
            <img className="empty__image" src={image} alt="" width="150" height="150"/>
            <h2 className="empty__title">{title}</h2>
            {description && <p className="empty__desc">{description}</p>}
            {action && <div className="empty__action">{action}</div>}
        </div>
    )
}

export default EmptyState
