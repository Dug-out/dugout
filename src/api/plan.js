import {PLAN_WINDOW_DAYS} from '../constants/planner.js'
import {supabase} from '../lib/supabase.js'
import {getMyTeam} from './profiles.js'

const DAY_MS = 24 * 60 * 60 * 1000

/** 경기 시작 시각의 한국 시간 요일(Mon~Sun)과 시(0~23) */
function kstDayAndHour(value) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        weekday: 'short',
        hour: 'numeric',
        hourCycle: 'h23',
    }).formatToParts(new Date(value))
    return {
        weekday: parts.find((part) => part.type === 'weekday').value,
        hour: Number(parts.find((part) => part.type === 'hour').value),
    }
}

/** 고른 "언제" 조건에 맞는 경기 시작 시각인지 · weekday 평일(월~금) 저녁 5시 이후 / weekend 토·일 / any 아무때나 */
function matchesWhen(value, when) {
    if (when === 'any') return true
    const {weekday, hour} = kstDayAndHour(value)
    const isWeekend = weekday === 'Sat' || weekday === 'Sun'
    return when === 'weekend' ? isWeekend : !isWeekend && hour >= 17
}

/**
 * 직관 플랜 만들기 · 조건에 맞는 경기 하나를 고른다 (AI 가 아니라 규칙)
 *  1) 오늘부터 PLAN_WINDOW_DAYS 일 안의 예정 경기 중 "언제" 조건에 맞는 것이 후보 (내 팀 경기만 오는 건 DB 규칙)
 *  2) 모집 중인 모집 글이 많은 경기 → 내 팀 홈 경기 → 날짜가 빠른 경기 순으로 가장 앞의 하나
 * @param {{conditions: {when: string}}} input
 * @returns {Promise<{myTeam: string, game: null | {id: number, gameAt: string, home: string, away: string, stadium: string,
 *   opponent: string, isHome: boolean}, mateCount: number}>} 후보가 없으면 game 이 null
 */
export async function makePlan({conditions}) {
    const myTeam = await getMyTeam()
    const now = new Date()

    const {data: games, error} = await supabase
        .from('games')
        .select('id, game_at, home_team, away_team, stadium')
        .eq('status', 'scheduled')
        .gt('game_at', now.toISOString())
        .lt('game_at', new Date(now.getTime() + PLAN_WINDOW_DAYS * DAY_MS).toISOString())
        .order('game_at')
    if (error) throw error

    const candidates = games.filter((row) => matchesWhen(row.game_at, conditions.when))
    if (candidates.length === 0) return {myTeam, game: null, mateCount: 0}

    // 후보 경기마다 모집 중인 글이 몇 개인지
    const {data: posts, error: postsError} = await supabase
        .from('mate_posts')
        .select('game_id')
        .in(
            'game_id',
            candidates.map((row) => row.id),
        )
        .eq('status', 'open')
    if (postsError) throw postsError

    const mateCounts = new Map()
    for (const {game_id: gameId} of posts) mateCounts.set(gameId, (mateCounts.get(gameId) ?? 0) + 1)

    const ranked = candidates
        .map((row) => ({row, mateCount: mateCounts.get(row.id) ?? 0, isHome: row.home_team === myTeam}))
        // 후보는 이미 날짜 순이라, 같은 점수끼리는 날짜가 빠른 쪽이 앞에 남는다 (sort 는 같은 값의 순서를 바꾸지 않는다)
        .sort((a, b) => b.mateCount - a.mateCount || Number(b.isHome) - Number(a.isHome))

    const {row, mateCount, isHome} = ranked[0]
    const {id, game_at: gameAt, home_team: home, away_team: away, stadium} = row
    return {myTeam, game: {id, gameAt, home, away, stadium, opponent: isHome ? away : home, isHome}, mateCount}
}
