import {supabase} from '../lib/supabase.js'

// 하루 길이 · 한국 시간은 세계 표준시보다 9시간 빠르다
const DAY_MS = 24 * 60 * 60 * 1000
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** 오늘(한국 시간) 0시 ~ 내일 0시 */
function kstToday() {
    const kst = new Date(Date.now() + KST_OFFSET_MS)
    const start = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - KST_OFFSET_MS
    return [new Date(start).toISOString(), new Date(start + DAY_MS).toISOString()]
}

/** 로그인한 내 id · 브리핑을 사용자마다 저장하는 이름표에 쓴다 */
export async function getMyUserId() {
    const {
        data: {session},
    } = await supabase.auth.getSession()
    return session.user.id
}

/**
 * 오늘(한국 시간) 내 팀 경기 · 경기가 시작하거나 끝나도 오늘 0~24시 동안은 이 경기다 (내 팀 경기만 오는 건 DB 규칙)
 * @returns {Promise<number | null>} 경기 id · 오늘 경기가 없으면 null
 */
export async function getTodayGameId() {
    const [start, end] = kstToday()
    const {data, error} = await supabase
        .from('games')
        .select('id')
        .gte('game_at', start)
        .lt('game_at', end)
        .neq('status', 'canceled')
        .order('game_at')
        .limit(1)
        .maybeSingle()
    if (error) throw error
    return data?.id ?? null
}

/**
 * 🔌 서버 함수 game-briefing · Claude 가 만든 한 줄 브리핑과 예상 스코어 (내 팀 : 상대)
 * @returns {Promise<{briefing: string, my: number, opp: number}>}
 */
export async function requestBriefing(gameId) {
    const {data, error} = await supabase.functions.invoke('game-briefing', {body: {gameId}})
    if (error) throw error
    return data
}
