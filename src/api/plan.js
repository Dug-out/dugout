import {FOOD_OPTIONS, PLAN_WINDOW_DAYS, SEAT_OPTIONS, STADIUM_CODE_BY_NAME} from '../constants/planner.js'
import {supabase} from '../lib/supabase.js'
import {getMyTeam} from './profiles.js'

const DAY_MS = 24 * 60 * 60 * 1000

// AI 경기 포인트 · AI 를 붙이기 전까지 모든 경기에 같은 임시 문구를 쓴다 (나중에 경기마다 AI 가 만든 글로 바뀐다)
const TEMP_AI = {
    highlight: '직관 가기 딱 좋은 경기예요!',
    point: '고른 조건에 잘 맞는 일정이라 응원하기 좋은 날이에요.',
    tags: ['조건 일치', '응원 열기'],
    sourceCount: 3,
}

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

/** 배열을 무작위로 섞은 새 배열 (Fisher-Yates) */
function shuffle(items) {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

/**
 * 구장 안 맛집 2곳 · 구장과 고른 음식 종류가 같은 매장 중에서 무작위로 뽑는다 (stadium_food) · 플랜을 만들 때마다 다른 매장이 나온다
 * 맛집은 플랜에 꼭 필요한 정보가 아니라서, 조회가 실패하면 플랜 전체를 막지 않고 빈 목록으로 대신한다
 */
async function getIndoorFoods(stadium, food) {
    const code = STADIUM_CODE_BY_NAME[stadium]
    const category = FOOD_OPTIONS.find((option) => option.value === food)?.label
    if (!code || !category) return []

    const {data, error} = await supabase
        .from('stadium_food')
        .select('id, name, category, location')
        .eq('stadium_code', code)
        .eq('category', category)
    if (error) return []

    return shuffle(data)
        .slice(0, 2)
        .map(({id, name, category: foodCategory, location}) => ({id, name, category: foodCategory, location}))
}

/**
 * 같은 경기 · 고른 좌석의 모집 중인 모임 · 최근 글 2개와 전체 개수 (mate_posts)
 * 모임은 플랜에 꼭 필요한 정보가 아니라서, 조회가 실패하면 플랜 전체를 막지 않고 빈 목록으로 대신한다
 */
async function getSeatMates(gameId, seat) {
    const seatLabel = SEAT_OPTIONS.find((option) => option.value === seat)?.label
    if (!seatLabel) return {count: 0, items: []}

    const {data, count, error} = await supabase
        .from('mate_posts')
        .select('id, title, seat, capacity, joined_count, host:profiles!host_id(nickname, avatar_url)', {
            count: 'exact',
        })
        .eq('game_id', gameId)
        .eq('seat', seatLabel)
        .eq('status', 'open')
        .order('created_at', {ascending: false})
        .limit(2)
    if (error) return {count: 0, items: []}

    const items = data.map((row) => {
        const {id, title, seat: postSeat, capacity, joined_count: joined, host} = row
        const {nickname, avatar_url: avatarUrl} = host
        return {id, title, seat: postSeat, capacity, joined, host: nickname, avatarUrl}
    })
    return {count: count ?? items.length, items}
}

/**
 * 직관 플랜 만들기 · 조건에 맞는 경기 하나를 고른다 (AI 가 아니라 규칙)
 *  1) 오늘부터 PLAN_WINDOW_DAYS 일 안의 예정 경기 중 "언제" 조건에 맞는 것이 후보 (내 팀 경기만 오는 건 DB 규칙)
 *  2) 모집 중인 모집 글이 많은 경기 → 내 팀 홈 경기 → 날짜가 빠른 경기 순으로 가장 앞의 하나
 * @param {{conditions: {when: string, food: string}}} input
 * @returns {Promise<{myTeam: string, game: null | {id: number, gameAt: string, home: string, away: string, stadium: string,
 *   opponent: string, isHome: boolean}, foods: {id: string, name: string, category: string, location: string | null}[],
 *   mates: {count: number, items: {id: string, title: string, seat: string, capacity: number, joined: number, host: string,
 *   avatarUrl: string | null}[]},
 *   ai?: {highlight: string, point: string, tags: string[], sourceCount: number}}>}
 *  후보가 없으면 game 이 null · foods 는 구장 안 맛집 · mates 는 같은 경기·좌석의 모집 글 · ai 는 AI 경기 포인트 (없으면 말풍선을 숨긴다)
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
    if (candidates.length === 0) return {myTeam, game: null, foods: [], mates: {count: 0, items: []}}

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

    const {row, isHome} = ranked[0]
    const {id, game_at: gameAt, home_team: home, away_team: away, stadium} = row
    const [foods, mates] = await Promise.all([
        getIndoorFoods(stadium, conditions.food),
        getSeatMates(id, conditions.seat),
    ])
    return {
        myTeam,
        game: {id, gameAt, home, away, stadium, opponent: isHome ? away : home, isHome},
        foods,
        mates,
        ai: TEMP_AI,
    }
}
