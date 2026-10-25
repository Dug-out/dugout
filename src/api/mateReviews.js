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

/** 평가할 메이트 한 명 · 평가 대기 목록에서 찾아 돌려준다 (이미 평가했거나 7일이 지났으면 null) */
export async function getReviewTodo(postId, userId) {
    const todos = await getReviewTodos()
    return todos.find((todo) => todo.postId === postId && todo.userId === userId) ?? null
}

/** 평가 실패 → 화면에 보여줄 문구 */
function createErrorMessage({code}) {
    if (code === '23505') return '이미 평가한 메이트예요'
    if (code === '42501') return '지금은 평가할 수 없어요. 함께 간 메이트가 아니거나 아직 끝나지 않은 경기예요'
    if (code === '23514') return '입력한 내용을 다시 확인해 주세요'
    return '평가하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/** 평가 보내기 · met 이 false(노쇼)면 점수는 0 이어야 한다 (매너 타율은 DB 트리거가 바꾼다) */
export async function createReview({postId, revieweeId, met, score, comment = ''}) {
    const {error} = await supabase
        .from('mate_reviews')
        .insert({post_id: postId, reviewee_id: revieweeId, met, score, comment: comment.trim()})
    if (error) throw Object.assign(new Error(createErrorMessage(error)), {cause: error})
}
