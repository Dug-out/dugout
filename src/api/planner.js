import {supabase} from '../lib/supabase.js'
import {BUDGET_MAX, MOCK_AI_GAMES, MOCK_STADIUM_FOOD, SEAT_TYPE_BY_PREF} from '../constants/planner.js'

const todayStr = () => new Date().toISOString().slice(0, 10)

/** ai_games 등이 아직 Supabase에 없을 때(schema_ai_planner.sql 미실행)만 나는 에러 */
const isMissingTable = (error) => error.code === 'PGRST205' || error.code === '42P01'

// saved_plans 테이블이 생기기 전까지 저장 플랜을 localStorage에 흉내 내 보관한다.
// 테이블이 생기면 아래 함수들이 먼저 Supabase를 시도하고, missing-table 에러일 때만 이쪽으로 빠진다.
const LOCAL_PLANS_KEY = 'dugout.mockSavedPlans.v1'

function readLocalPlans() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_PLANS_KEY)) ?? []
    } catch {
        return []
    }
}

function writeLocalPlans(plans) {
    localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify(plans))
}

/** 사용자 응원팀의 다가오는 더미 경기 + 구장 + 좌석을 함께 가져온다 */
export async function fetchUpcomingGames(team) {
    const {data, error} = await supabase
        .from('ai_games')
        .select('*, stadiums(name, transit_minutes, transit_line), game_seats(*)')
        .or(`home_team.eq.${team},away_team.eq.${team}`)
        .gte('game_date', todayStr())
        .order('game_date', {ascending: true})
        .limit(10)
    if (!error) return data
    if (!isMissingTable(error)) throw error

    console.warn('[planner] ai_games 테이블이 아직 없어 로컬 더미로 대신 보여줘요. supabase/schema_ai_planner.sql을 실행하면 사라져요.')
    const today = todayStr()
    return MOCK_AI_GAMES
        .filter((g) => (g.home_team === team || g.away_team === team) && g.game_date >= today)
        .sort((a, b) => a.game_date.localeCompare(b.game_date))
        .slice(0, 10)
}

/**
 * 조건(좌석·예산·동행)에 가장 맞는 좌석 한 구역을 고른다.
 * "친구랑"이면 2연석 가능한 구역을 먼저 찾고, 꼭 맞는 게 없으면 잔여석 있는 아무 구역.
 */
function pickSeat(seats, seatPref, budgetPref, withPref) {
    const wantType = SEAT_TYPE_BY_PREF[seatPref]
    const maxPrice = BUDGET_MAX[budgetPref]
    const fits = seats.filter((s) => s.seat_type === wantType && s.price <= maxPrice && s.remaining_count > 0)
    if (withPref === '친구랑') {
        const paired = fits.find((s) => s.note?.includes('2연석'))
        if (paired) return paired
    }
    return fits[0] ?? seats.find((s) => s.remaining_count > 0) ?? null
}

/**
 * 경기 추천 점수 계산 (규칙 기반 — LLM 아님).
 * 승률 · 투수 평균자책점은 수집한 데이터가 없어 뺐다. 고른 조건(언제 · 누구랑 · 좌석 · 예산)에
 * 얼마나 맞는지만으로 점수를 매긴다.
 */
export function scoreGame(game, conditions) {
    const day = new Date(`${game.game_date}T00:00:00`).getDay() // 0 일 ~ 6 토
    const hour = Number(game.start_time.slice(0, 2))

    let score = 50
    if (conditions.when === '주말만') score += day === 0 || day === 6 ? 20 : -30
    if (conditions.when === '평일 저녁') score += day >= 1 && day <= 5 && hour >= 18 ? 15 : -20

    const seat = pickSeat(game.game_seats, conditions.seat, conditions.budget, conditions.with)
    if (seat) {
        score += 10
        if (conditions.with === '친구랑' && seat.note?.includes('2연석')) score += 8
        if (seat.remaining_count / seat.total_count >= 0.3) score += 6
        if (seat.remaining_count === 0) score -= 25
    } else {
        score -= 20
    }

    if (conditions.food && conditions.food !== '상관없음') {
        const hasPreferredFood = (MOCK_STADIUM_FOOD[game.stadium_code] ?? []).some((f) => f.category === conditions.food)
        if (hasPreferredFood) score += 8
    }

    return {score: Math.max(1, Math.min(99, score)), seat}
}

/** 조건에 맞춰 경기들을 추천 점수순으로 정렬 */
export function rankGames(games, conditions) {
    return games
        .map((game) => ({game, ...scoreGame(game, conditions)}))
        .sort((a, b) => b.score - a.score)
}

/** 고른 조건(언제·누구랑·좌석·예산·선호 음식) 하나하나가 이 경기에 맞는지 — 조건별 체크리스트 배지에 쓴다 */
export function matchChecklist(game, seat, conditions, mateCount = 0) {
    const day = new Date(`${game.game_date}T00:00:00`).getDay()
    const when =
        conditions.when === '이번 주 아무때나' ||
        (conditions.when === '주말만' && (day === 0 || day === 6)) ||
        (conditions.when === '평일 저녁' && day >= 1 && day <= 5)
    const withHit =
        conditions.with === '친구랑' ? !!seat?.note?.includes('2연석')
            : conditions.with === '메이트 구해요' ? mateCount > 0
                : true // '혼자'는 조건 제약이 없음
    const seatHit = !!seat && seat.seat_type === SEAT_TYPE_BY_PREF[conditions.seat]
    const budget = !!seat && seat.price <= BUDGET_MAX[conditions.budget]
    const food = conditions.food === '상관없음' || (MOCK_STADIUM_FOOD[game.stadium_code] ?? []).some((f) => f.category === conditions.food)
    return {when, with: withHit, seat: seatHit, budget, food}
}

/** 체크리스트 → "N% 일치" 배지 숫자 */
export function matchPercent(checklist) {
    const hits = Object.values(checklist).filter(Boolean).length
    return Math.round((hits / Object.keys(checklist).length) * 100)
}

/** '18:30:00' + -60분 → '17:30' */
export function addMinutes(timeStr, delta) {
    const [h, m] = timeStr.slice(0, 5).split(':').map(Number)
    const total = (h * 60 + m + delta + 1440) % 1440
    const hh = String(Math.floor(total / 60)).padStart(2, '0')
    const mm = String(total % 60).padStart(2, '0')
    return `${hh}:${mm}`
}

export const dday = (dateStr) => {
    const diff = Math.round((new Date(`${dateStr}T00:00:00`) - new Date(`${todayStr()}T00:00:00`)) / 86400000)
    return diff === 0 ? 'D-DAY' : `D-${diff}`
}

/** 경기장 맛집 · 카페 더미. 선호 음식을 고르면 그 카테고리를 앞으로 당겨서 보여준다 */
export function stadiumFood(stadiumCode, preferredCategory) {
    const list = MOCK_STADIUM_FOOD[stadiumCode] ?? []
    if (!preferredCategory || preferredCategory === '상관없음') return list
    return [...list].sort((a, b) => (a.category === preferredCategory ? 0 : 1) - (b.category === preferredCategory ? 0 : 1))
}

/** 추천 이유 — 고른 조건(언제·누구랑·좌석·예산·선호 음식)을 그대로 언급해서, 조건이 결과에 반영됐다는 걸 보여준다 */
export function buildReasons({game, seat, conditions}) {
    const hour = Number(game.start_time.slice(0, 2))
    const reasons = []

    if (conditions.when === '평일 저녁') reasons.push(`'평일 저녁' 조건에 맞는 ${game.start_time.slice(0, 5)} 경기예요`)
    else if (conditions.when === '주말만') reasons.push(`'주말만' 조건에 맞는 주말 경기예요`)
    else if (hour >= 18) reasons.push(`퇴근 후 도착 가능한 ${game.start_time.slice(0, 5)} 경기예요`)

    if (seat) {
        if (conditions.with === '친구랑' && seat.note?.includes('2연석')) {
            reasons.push(`'친구랑' 가기 좋은 2연석 ${seat.zone}이에요`)
        } else {
            reasons.push(`'${conditions.seat}' 조건에 맞는 ${seat.zone} · ${seat.price.toLocaleString('ko-KR')}원이에요`)
        }
    }

    if (game.rain_chance != null && game.rain_chance <= 20) {
        reasons.push(`${game.weather_desc} ${game.weather_temp}° · 강수확률 ${game.rain_chance}%로 야외 관람 좋은 날이에요`)
    }

    const [food] = stadiumFood(game.stadium_code, conditions.food)
    if (food) {
        const matched = food.category === conditions.food
        reasons.push(
            matched
                ? `선호하신 '${conditions.food}' 맛집 '${food.name}' 도보 ${food.walk_min}분 · 평점 ${food.rating}`
                : `구장 맛집 '${food.name}' 도보 ${food.walk_min}분 · 평점 ${food.rating}`,
        )
    }
    return reasons
}

/** "플랜" 탭 · 저장한 플랜 전체 목록(최신순) */
export async function fetchSavedPlans(userId) {
    const {data, error} = await supabase
        .from('saved_plans')
        .select('*, games:ai_games(*, stadiums(name))')
        .eq('user_id', userId)
        .order('created_at', {ascending: false})
    if (!error) return data
    if (!isMissingTable(error)) throw error

    return readLocalPlans()
        .filter((p) => p.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((plan) => ({...plan, games: MOCK_AI_GAMES.find((g) => g.id === plan.game_id) ?? null}))
}

export async function countSavedPlans(userId) {
    const {count, error} = await supabase
        .from('saved_plans')
        .select('id', {count: 'exact', head: true})
        .eq('user_id', userId)
    if (!error) return count ?? 0
    if (!isMissingTable(error)) throw error

    return readLocalPlans().filter((p) => p.user_id === userId).length
}

export async function savePlan({userId, gameId, companionType, seatZone, budgetTier}) {
    const {data, error} = await supabase
        .from('saved_plans')
        .insert({
            user_id: userId,
            game_id: gameId,
            companion_type: companionType,
            seat_zone: seatZone,
            budget_tier: budgetTier,
        })
        .select()
        .single()
    if (!error) return data
    if (!isMissingTable(error)) throw error

    console.warn('[planner] saved_plans 테이블이 아직 없어 로컬(localStorage)에 임시로 저장해요. supabase/schema_ai_planner.sql을 실행하면 사라져요.')
    const plan = {
        id: `mock-plan-${Date.now()}`,
        user_id: userId,
        game_id: gameId,
        companion_type: companionType,
        seat_zone: seatZone,
        budget_tier: budgetTier,
        checklist: {ticket: false, mate: false, food: false, transit: false},
        created_at: new Date().toISOString(),
    }
    writeLocalPlans([...readLocalPlans(), plan])
    return plan
}

export async function updateChecklist(planId, checklist) {
    const {error} = await supabase.from('saved_plans').update({checklist}).eq('id', planId)
    if (!error) return
    if (!isMissingTable(error)) throw error

    writeLocalPlans(readLocalPlans().map((p) => (p.id === planId ? {...p, checklist} : p)))
}

/** "플랜" 탭 · 하나 또는 여러 개를 한 번에 삭제 (단일 삭제도 배열 길이 1로 호출) */
export async function deleteSavedPlans(planIds) {
    const {error} = await supabase.from('saved_plans').delete().in('id', planIds)
    if (!error) return
    if (!isMissingTable(error)) throw error

    writeLocalPlans(readLocalPlans().filter((p) => !planIds.includes(p.id)))
}
