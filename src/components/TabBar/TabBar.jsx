import {NavLink} from 'react-router'
import Icon from '../Icon/Icon.jsx'
import './TabBar.css'

// 탭 5개 · 거래 탭 대신 "플랜"(AI 직관 플래너로 저장한 플랜 목록)을 넣는다
const TABS = [
    {to: '/home', icon: 'home', label: '홈'},
    {to: '/mate', icon: 'mate', label: '메이트 찾기'},
    {to: '/plans', icon: 'sparkle', label: '플랜'},
    {to: '/record', icon: 'record', label: '직관 기록'},
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
                            <Icon name={icon} strokeWidth={isActive ? 2 : 1.8} />
                            {label}
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}

export default TabBar
