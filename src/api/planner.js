import {supabase} from '../lib/supabase.js'
import {MOCK_STADIUMS, STADIUM_CODE_BY_NAME} from '../constants/planner.js'

const todayStr = () => new Date().toISOString().slice(0, 10)

/** saved_plans 등이 아직 Supabase에 없을 때(schema_ai_planner.sql 미실행)만 나는 에러 */
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

/** games.game_at(UTC로 내려오는 timestamptz)을 한국 시간 기준 '날짜'·'시간' 문자열로 쪼갠다 */
export function splitGameAt(isoString) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(new Date(isoString))
    const get = (type) => parts.find((p) => p.type === type)?.value
    return {date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}:${get('second')}`}
}

/**
 * 사용자 응원팀의 다가오는 경기를 가져온다. 경기 일정은 팀원이 만든 public.games를 그대로 쓰고
 * (RLS가 이미 "내 응원팀 경기만" 걸러준다), 날씨·대기질·맛집 조회에 쓸 구장 위경도만 붙여 돌려준다.
 */
export async function fetchUpcomingGames() {
    const {data, error} = await supabase
        .from('games')
        .select('*')
        .eq('status', 'scheduled')
        .gte('game_at', new Date().toISOString())
        .order('game_at', {ascending: true})
        .limit(10)
    if (error) throw error

    return data.map((g) => {
        const {date, time} = splitGameAt(g.game_at)
        const stadiumCode = STADIUM_CODE_BY_NAME[g.stadium]
        return {
            id: g.id,
            game_date: date,
            start_time: time,
            home_team: g.home_team,
            away_team: g.away_team,
            stadium_code: stadiumCode,
            stadiums: stadiumCode ? MOCK_STADIUMS[stadiumCode] : null,
        }
    })
}

/**
 * 경기 추천 점수 계산 (규칙 기반 — LLM 아님).
 * 승률 · 투수 평균자책점 · 좌석 잔여석은 수집한 데이터가 없어 뺐다. 고른 "언제" 조건에만 맞춰 점수를 매긴다.
 */
export function scoreGame(game, conditions) {
    const day = new Date(`${game.game_date}T00:00:00`).getDay() // 0 일 ~ 6 토
    const hour = Number(game.start_time.slice(0, 2))

    let score = 50
    if (conditions.when === '평일') score += day >= 1 && day <= 5 ? 20 : -30
    if (conditions.when === '저녁') score += hour >= 18 ? 15 : -20

    return {score: Math.max(1, Math.min(99, score))}
}

/** 조건에 맞춰 경기들을 추천 점수순으로 정렬 */
export function rankGames(games, conditions) {
    return games
        .map((game) => ({game, ...scoreGame(game, conditions)}))
        .sort((a, b) => b.score - a.score)
}

/** 고른 조건(언제·누구랑) 하나하나가 이 경기에 맞는지 — 조건별 체크리스트 배지에 쓴다 */
export function matchChecklist(game, conditions, mateCount = 0) {
    const day = new Date(`${game.game_date}T00:00:00`).getDay()
    const hour = Number(game.start_time.slice(0, 2))
    const when =
        conditions.when === '아무때나' ||
        (conditions.when === '평일' && day >= 1 && day <= 5) ||
        (conditions.when === '저녁' && hour >= 18)
    const withHit = conditions.with === '메이트 구해요' ? mateCount > 0 : true
    return {when, with: withHit}
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

/** 맛집 목록(카카오 로컬 API 실데이터)에서 선호 음식 카테고리를 앞으로 당겨서 보여준다 */
export function sortFoodByPreferred(list, preferredCategory) {
    if (!preferredCategory || preferredCategory === '상관없음') return list
    return [...list].sort((a, b) => (a.category === preferredCategory ? 0 : 1) - (b.category === preferredCategory ? 0 : 1))
}

// 좌석 조건(내야석/외야석) → stadium_food.location 문자열에 들어있는 방향 키워드.
// 응원석·테이블석은 방향 정보가 없어 건너뛴다 (games에 좌석 잔여석이 없어 1루/3루 같은 세부 구역은 알 수 없다).
const SEAT_PREF_LOCATION_KEYWORD = {'내야석': '내야', '외야석': '외야'}

/** "구장 내" 맛집을 좌석 조건과 같은 방향부터 보여주고, 그 안에서 선호 음식을 또 당긴다 */
export function sortIndoorFoodBySeat(list, seatPref, preferredCategory) {
    const keyword = SEAT_PREF_LOCATION_KEYWORD[seatPref]
    const sideHit = (f) => !!keyword && !!f.location?.includes(keyword)
    return [...list].sort((a, b) => {
        const sideDiff = (sideHit(b) ? 1 : 0) - (sideHit(a) ? 1 : 0)
        if (sideDiff !== 0) return sideDiff
        if (!preferredCategory || preferredCategory === '상관없음') return 0
        return (a.category === preferredCategory ? 0 : 1) - (b.category === preferredCategory ? 0 : 1)
    })
}

/** 추천 이유 — 고른 조건(언제·누구랑·좌석·선호 음식)을 그대로 언급해서, 조건이 결과에 반영됐다는 걸 보여준다 */
export function buildReasons({game, conditions, foodSpot}) {
    const hour = Number(game.start_time.slice(0, 2))
    const reasons = []

    if (conditions.when === '저녁') reasons.push(`'저녁' 조건에 맞는 ${game.start_time.slice(0, 5)} 경기예요`)
    else if (conditions.when === '평일') reasons.push(`'평일' 조건에 맞는 평일 경기예요`)
    else if (hour >= 18) reasons.push(`퇴근 후 도착 가능한 ${game.start_time.slice(0, 5)} 경기예요`)

    if (game.rain_chance != null && game.rain_chance <= 20) {
        reasons.push(`${game.weather_desc} ${game.weather_temp}° · 강수확률 ${game.rain_chance}%로 야외 관람 좋은 날이에요`)
    }

    if (foodSpot) {
        const matched = foodSpot.category === conditions.food
        // 구장 내 항목은 location("3루 3층"), 구장 주변 항목은 walk_min(도보 분)을 갖는다.
        const where = foodSpot.location ? `구장 내 ${foodSpot.location}` : `도보 ${foodSpot.walk_min}분`
        reasons.push(
            matched
                ? `선호하신 '${conditions.food}' 맛집 '${foodSpot.name}' ${where}`
                : `구장 맛집 '${foodSpot.name}' ${where}`,
        )
    }
    return reasons
}

/** "플랜" 탭 · 저장한 플랜 전체 목록(최신순) */
export async function fetchSavedPlans(userId) {
    const {data, error} = await supabase
        .from('saved_plans')
        .select('*, games(*)')
        .eq('user_id', userId)
        .order('created_at', {ascending: false})
    if (!error) return data
    if (!isMissingTable(error)) throw error

    return readLocalPlans()
        .filter((p) => p.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((plan) => ({...plan, games: null}))
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

export async function savePlan({userId, gameId, companionType, seatZone}) {
    const {data, error} = await supabase
        .from('saved_plans')
        .insert({
            user_id: userId,
            game_id: gameId,
            companion_type: companionType,
            seat_zone: seatZone,
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
