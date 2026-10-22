import {NavLink} from 'react-router'
import Icon from '../Icon/Icon.jsx'
import './TabBar.css'

// 탭 5개 · 거래 탭은 화면이 아직 없어 경로만 잡아 둔다
const TABS = [
    {to: '/home', icon: 'home', label: '홈'},
    {to: '/mate', icon: 'mate', label: '메이트 찾기'},
    {to: '/record', icon: 'record', label: '직관 기록'},
    {to: '/trade', icon: 'trade', label: '거래'},
    {to: '/my', icon: 'my', label: '마이'},
]

/** 하단 탭바 · 선택 탭은 남색(라우터 현재 경로 기준), 나머지는 회색 */
function TabBar() {
    return (
        <nav className="tabbar" aria-label="하단 메뉴">
            {TABS.map(({to, icon, label}) => (
                <NavLink key={to} to={to} className="tabbar__item">
                    {({isActive}) => (
                        <>
                            <Icon name={icon} strokeWidth={isActive ? 2 : 1.8}/>
                            {label}
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}

export default TabBar
