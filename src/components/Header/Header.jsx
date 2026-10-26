import useGoBack from '../../hooks/useGoBack.js'
import Icon from '../Icon/Icon.jsx'
import './Header.css'

/**
 * 상단 헤더 · 높이 64px(+구분선)
 *  - 하위 화면(기본): 뒤로가기 + 제목 17px. 온 화면이 있으면 그리로 돌아가고, 주소로 바로 들어왔으면 backTo(없으면 홈)로 간다. onBack이 있으면 그 함수를 대신 부른다.
 *  - large: 탭 화면용 큰 제목(Jua 24px). 뒤로가기 없음.
 * subtitle: 제목 아래 작은 글자 한 줄 (채팅방의 "멤버 3명" 등)
 * right: 오른쪽 아이콘 버튼 등 (44×44 버튼을 넣는다)
 */
function Header({title, subtitle, large = false, backTo, onBack, right, className = ''}) {
    // 고정 경로로 보내면 history에 화면이 쌓여 뒤로가기가 되돌아오므로, 온 화면으로 돌아간다
    const goBack = useGoBack(backTo)
    const classes = ['header', large && 'header--large', className].filter(Boolean).join(' ')

    return (
        <header className={classes}>
            {!large && (
                <button type="button" className="header__back" aria-label="뒤로" onClick={onBack ?? goBack}>
                    <Icon name="back" />
                </button>
            )}
            {subtitle ? (
                <div className="header__text">
                    <h1 className="header__title">{title}</h1>
                    <span className="header__subtitle">{subtitle}</span>
                </div>
            ) : (
                <h1 className="header__title">{title}</h1>
            )}
            {right && <div className="header__right">{right}</div>}
        </header>
    )
}

export default Header
