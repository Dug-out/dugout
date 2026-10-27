import {supabase} from '../lib/supabase.js'

/** [경기 선택] 목록 · 시작 전 예정 경기를 빠른 순으로 (내 팀 경기만 오는 건 DB 규칙) */
export async function getSelectableGames() {
    const {data, error} = await supabase
        .from('games')
        .select('id, game_at, home_team, away_team, stadium')
        .eq('status', 'scheduled')
        .gt('game_at', new Date().toISOString())
        .order('game_at')
    if (error) throw error
    return data.map((row) => {
        const {id, game_at: gameAt, home_team: home, away_team: away, stadium} = row
        return {id, gameAt, home, away, stadium}
    })
}
