import {supabase} from '../lib/supabase.js'
import {getMyTeam} from './mate.js'

/**
 * 내 직관 약속 · 내가 방장이거나 참여(신청) 중인 모집 글을 가져온다 (거절당했거나 나간 글은 뺀다)
 * accepted 는 수락된 참여자(방장 포함)인지이고, false 이면 아직 수락 대기 중이다.
 */
export async function getMyPosts() {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user
    const myTeam = await getMyTeam()

    const {data, error} = await supabase
        .from('mate_members')
        .select(`
            role, status,
            post:mate_posts!inner(
                id, title, image_url, capacity, status, joined_count,
                host:profiles!host_id(nickname),
                game:games!inner(game_at, home_team, away_team, stadium)
            )
        `)
        .eq('user_id', userId)
        .in('status', ['pending', 'accepted'])
    if (error) throw error

    const items = data.map((row) => {
        const {role, status, post} = row
        const {id, title, image_url: image, capacity, status: postStatus, joined_count: joinedCount} = post
        const {host, game} = post
        return {
            id,
            title,
            image,
            role,
            accepted: status === 'accepted',
            isOpen: postStatus === 'open',
            capacity,
            joinedCount,
            hostNickname: host.nickname,
            game: {gameAt: game.game_at, home: game.home_team, away: game.away_team, stadium: game.stadium},
        }
    })
    return {myTeam, items}
}
