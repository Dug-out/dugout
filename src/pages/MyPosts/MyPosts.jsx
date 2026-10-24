import {Link} from 'react-router'
import {Button, EmptyState, Header} from '../../components'
import './MyPosts.css'

/** 내 직관 약속 (My-posts.dc.html) · 아직 약속 테이블이 없어 빈 화면(Empty-posts.dc.html)만 보여 준다 */
function MyPosts() {
    return (
        <div className="my-posts">
            <Header title="내 직관 약속" backTo="/my"/>
            <EmptyState title="아직 잡힌 직관 약속이 없어요"
                        description={<>모집 글에 참여하거나<br/>직접 글을 올려 메이트를 모아 보세요</>}
                        action={<Button as={Link} to="/home">메이트 찾으러 가기</Button>}/>
        </div>
    )
}

export default MyPosts
