import {supabase} from '../lib/supabase.js'
import {getMyTeam} from './profiles.js'

/** 신청 실패 → 화면에 보여줄 문구 */
function applyErrorMessage({code}) {
    if (code === '23505') return '이미 신청한 모집 글이에요'
    if (code === '42501') return '지금은 신청할 수 없어요. 모집이 마감됐거나 경기가 이미 시작됐을 수 있어요'
    if (code === '23514') return '입력한 내용을 다시 확인해 주세요'
    return '신청하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/** 참여 신청 · 한마디와 함께 대기 상태로 신청한다 (수락은 방장이 한다) */
export async function applyToMatePost({postId, message = ''}) {
    const {error} = await supabase.from('mate_members').insert({post_id: postId, message: message.trim()})
    if (error) throw Object.assign(new Error(applyErrorMessage(error)), {cause: error})
}

/** 내 직관 약속 · 내가 방장이거나 수락된 참여자인 모집 글을 가져온다 (수락 대기·거절·나간 글은 뺀다) */
export async function getMyPosts() {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user
    const myTeam = await getMyTeam()

    const {data, error} = await supabase
        .from('mate_members')
        .select(`
            role,
            post:mate_posts!inner(
                id, title, image_url, capacity, joined_count,
                host:profiles!host_id(nickname),
                game:games!inner(game_at, home_team, away_team, stadium)
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted')
    if (error) throw error

    const items = data.map((row) => {
        const {role, post} = row
        const {id, title, image_url: image, capacity, joined_count: joinedCount} = post
        const {host, game} = post
        return {
            id,
            title,
            image,
            role,
            capacity,
            joinedCount,
            hostNickname: host.nickname,
            game: {gameAt: game.game_at, home: game.home_team, away: game.away_team, stadium: game.stadium},
        }
    })
    return {myTeam, items}
}
