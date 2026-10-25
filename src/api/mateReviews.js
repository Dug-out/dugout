import {supabase} from '../lib/supabase.js'

/** 평가할 메이트 목록 · 끝난 지 7일 안이고 아직 평가하지 않은, 함께 간 사람들 (DB 함수 my_review_todos) */
export async function getReviewTodos() {
    const {data, error} = await supabase.rpc('my_review_todos')
    if (error) throw error

    return data.map((row) => {
        const {post_id: postId, post_title: postTitle, game_at: gameAt, home_team: home, away_team: away} = row
        const {stadium, user_id: userId, role, nickname, avatar_url: avatarUrl, days_left: daysLeft} = row
        return {
            postId,
            postTitle,
            game: {gameAt, home, away, stadium},
            userId,
            isHost: role === 'host',
            nickname,
            avatarUrl,
            daysLeft,
        }
    })
}

/** 내가 한 평가 목록 · 최근 것부터 */
export async function getMyReviews() {
    const {data, error} = await supabase
        .from('mate_reviews')
        .select(
            `id, post_id, reviewee_id, created_at,
            post:mate_posts(host_id, title, game:games(game_at, home_team, away_team, stadium)),
            reviewee:profiles!reviewee_id(nickname, avatar_url)`,
        )
        .order('created_at', {ascending: false})
    if (error) throw error

    return data.map((row) => {
        const {id, post_id: postId, reviewee_id: userId, post, reviewee} = row
        const {game} = post
        return {
            id,
            postId,
            postTitle: post.title,
            game: {gameAt: game.game_at, home: game.home_team, away: game.away_team, stadium: game.stadium},
            userId,
            isHost: post.host_id === userId,
            nickname: reviewee.nickname,
            avatarUrl: reviewee.avatar_url,
        }
    })
}
