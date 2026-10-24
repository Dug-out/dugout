import {supabase} from '../lib/supabase.js'

/** DB 한 줄(snake_case) → 화면에서 쓰는 모양(camelCase) */
function toGame(row) {
    return {
        id: row.id,
        gameAt: row.game_at,
        home: row.home_team,
        away: row.away_team,
        stadium: row.stadium,
    }
}

/** 브라우저에 저장된 로그인 정보에서 id를 읽고, 해당 사용자의 team을 조회 */
export async function getMyTeam() {
    const {data: {session}} = await supabase.auth.getSession()

    const {data, error} = await supabase
        .from('profiles')
        .select('team')
        .eq('id', session.user.id)
        .single()
    if (error) throw error
    return data.team
}

/** [경기 선택] 목록 · 시작 전 예정 경기를 빠른 순으로 (내 팀 경기만 오는 건 DB 규칙) */
export async function getSelectableGames() {
    const {data, error} = await supabase
        .from('games')
        .select('id, game_at, home_team, away_team, stadium')
        .eq('status', 'scheduled')
        .gt('game_at', new Date().toISOString())
        .order('game_at')
    if (error) throw error
    return data.map(toGame)
}

/** 저장 실패 → 화면에 보여줄 문구 */
function createErrorMessage(error) {
    if (error.code === '42501') return '이 경기로는 모집 글을 올릴 수 없어요. 경기를 다시 골라 주세요'
    if (error.code === '23514' || error.code === '23502') return '입력한 내용을 다시 확인해 주세요'
    if (error.code === '23503') return '선택한 경기를 찾을 수 없어요'
    return '모집 글을 올리지 못했어요. 잠시 후 다시 시도해 주세요'
}

/**
 * [모집 글 올리기] 모집 글 저장 · 방장과 내 응원팀은 알아서 채운다
 * 값의 규칙은 constants/policy.js 의 MATE_POST 참고 (어기면 Error, message는 그대로 보여줘도 된다)
 * @returns {Promise<{id: string}>} 새 글의 id
 */
export async function createMatePost({gameId, title, seat, capacity, ages = [], gender = '무관', description = '', imageUrl = null}) {
    const team = await getMyTeam()

    const {data, error} = await supabase
        .from('mate_posts')
        .insert({
            team,
            game_id: gameId,
            title: title.trim(),
            seat,
            capacity,
            ages,
            gender,
            description: description.trim(),
            image_url: imageUrl,
        })
        .select('id')
        .single()
    if (error) throw Object.assign(new Error(createErrorMessage(error)), {cause: error})
    return {id: data.id}
}
