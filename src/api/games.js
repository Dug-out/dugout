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

/** 이번 주(오늘부터 일요일까지) 남은 내 팀 경기 수 · 홈 상단 안내에 쓴다 (내 팀 경기만 오는 건 DB 규칙) */
export async function getWeekGameCount() {
    const now = new Date()
    // 이번 주 일요일 밤 12시 (일요일이면 오늘 밤 12시)
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((7 - now.getDay()) % 7) + 1)

    const {count, error} = await supabase
        .from('games')
        .select('id', {count: 'exact', head: true})
        .eq('status', 'scheduled')
        .gt('game_at', now.toISOString())
        .lt('game_at', weekEnd.toISOString())
    if (error) throw error

    return count ?? 0
}
