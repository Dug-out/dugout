import {Outlet} from 'react-router'
import TabBar from '../TabBar/TabBar.jsx'
import './TabLayout.css'

/** 탭바가 있는 화면의 틀 · 라우트의 자식 화면(홈, 마이 등)이 Outlet 자리에 들어오고 아래에 탭바가 붙는다 */
function TabLayout() {
    return (
        <div className="tab-layout">
            <div className="tab-layout__page">
                <Outlet />
            </div>
            <TabBar />
        </div>
    )
}

export default TabLayout
