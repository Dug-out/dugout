import {useParams} from 'react-router'
import useProfile from '../../hooks/useProfile.js'
import ReviewsView from './ReviewsView.jsx'

/** 다른 사람의 매너 후기 전체보기 · 제목에 그 사람의 닉네임을 쓴다 */
function ProfileReviews() {
    const {id} = useParams()
    const {profile} = useProfile(id)

    return <ReviewsView userId={id} title={`${profile?.nickname ?? ''}님의 매너 후기`} backTo={`/profile/${id}`} />
}

export default ProfileReviews
