import {Link, useNavigate} from 'react-router'
import Icon from '../Icon/Icon.jsx'
import './Header.css'

/**
 * 상단 헤더 · 높이 64px(+구분선)
 *  - 하위 화면(기본): 뒤로가기 + 제목 17px. backTo가 있으면 그 경로로, onBack이 있으면 그 함수를, 없으면 history 뒤로.
 *  - large: 탭 화면용 큰 제목(Jua 24px). 뒤로가기 없음.
 * right: 오른쪽 아이콘 버튼 등 (44×44 버튼을 넣는다)
 */
function Header({title, large = false, backTo, onBack, right, className = ''}) {
    const navigate = useNavigate()
    const classes = ['header', large && 'header--large', className].filter(Boolean).join(' ')

    return (
        <header className={classes}>
            {!large && (backTo ? (
                <Link to={backTo} className="header__back" aria-label="뒤로">
                    <Icon name="back"/>
                </Link>
            ) : (
                <button type="button" className="header__back" aria-label="뒤로"
                        onClick={onBack ?? (() => navigate(-1))}>
                    <Icon name="back"/>
                </button>
            ))}
            <h1 className="header__title">{title}</h1>
            {right && <div className="header__right">{right}</div>}
        </header>
    )
}

export default Header
