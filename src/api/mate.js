// 메이트 찾기(모집 글) 데이터 함수 모음
// 화면은 Supabase를 직접 부르지 않고 이 파일의 함수만 부른다.
// → DB 테이블 이름·컬럼이 바뀌어도 이 파일만 고치면 화면 코드는 그대로 둘 수 있다.
import {supabase} from '../lib/supabase.js'
import * as mock from './mock/mate.js'

// 샘플 데이터 모드 스위치
// .env 에 VITE_USE_MOCK=true 를 넣으면 DB 대신 src/api/mock/mate.js 의 샘플 데이터를 쓴다.
// .env 는 git에 올라가지 않으므로 각자 컴퓨터에서만 켜진다 (팀원에게 영향 없음).
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** 한 번에 불러오는 모집 글 수 (무한 스크롤 한 페이지) */
export const PAGE_SIZE = 10

// 🔌 DB 담당자와 맞출 이름 · 테이블이 정해지면 여기만 고친다
export const DB = {
    // 모집 글 목록용 뷰(view) · 아직 없음
    // 한 줄에 [모집 글 + 경기 + 방장 닉네임·매너 타율 + 확정 인원]이 같이 있어야 목록을 한 번에 불러올 수 있다.
    // 필요한 컬럼: id, team, title, image_url, is_open, max_members, joined_count, seat, ages, gender, created_at,
    //            game_at, home_team, away_team, stadium_name, host_id, host_nickname, host_avatar_url, host_manner
    POST_LIST: 'mate_post_list',
    // 경기 일정 테이블 · 아직 없음 · 필요한 컬럼: id, game_at, home_team, away_team, stadium_name
    GAMES: 'games',
    // 회원 공개 프로필 · 이미 있음 (supabase/schema.sql)
    PROFILES: 'profiles',
}

// 오늘 0시 (오늘 이전 경기의 모집 글은 목록에서 뺄 때 쓴다)
const todayStart = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

// 날짜 하루의 시작(0시)과 다음 날 0시 · "그날 경기"를 찾을 때 [시작, 끝) 범위로 쓴다
const dayRange = (date) => {
    const from = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const to = new Date(from)
    to.setDate(to.getDate() + 1)
    return [from, to]
}

// DB 한 줄(snake_case 이름) → 화면에서 쓰는 모양(camelCase 이름)
// 화면은 이 모양만 알면 된다. 샘플 데이터(mock)도 같은 모양으로 돌려준다.
function toPost(row) {
    return {
        id: row.id,
        title: row.title,
        imageUrl: row.image_url, // 없으면 null → 화면에서 기본 이미지(mate-default.png)
        isOpen: row.is_open, // 모집 중 여부 (방장이 마감했거나 인원이 다 차면 false)
        maxMembers: row.max_members, // 모집 인원 (본인 포함 2~10)
        joinedCount: row.joined_count, // 확정 인원 (방장 + 수락된 사람)
        seat: row.seat, // 응원석 / 테이블석 / 내야석 / 외야석
        ages: row.ages ?? [], // ['20대', '30대'] · 빈 배열이면 나이 무관
        gender: row.gender, // 여성 / 남성 / 무관
        createdAt: row.created_at, // 글 올린 시각 (최신순 · 오래된순 정렬 기준)
        game: toGame({
            id: row.game_id,
            game_at: row.game_at,
            home_team: row.home_team,
            away_team: row.away_team,
            stadium_name: row.stadium_name,
        }),
        host: {
            id: row.host_id,
            nickname: row.host_nickname,
            avatarUrl: row.host_avatar_url, // 없으면 null → 기본 프로필 이미지
            manner: Number(row.host_manner), // 매너 타율 (DB numeric은 문자열로 올 수 있어 숫자로 바꾼다)
        },
    }
}

function toGame(row) {
    return {
        id: row.id,
        gameAt: row.game_at, // 경기 시작 시각
        home: row.home_team, // 홈 팀 코드 (LG, DOOSAN …)
        away: row.away_team, // 원정 팀 코드
        stadium: row.stadium_name, // 구장 이름
    }
}

/**
 * 🔌 내 응원팀 코드 (예: 'LG') · profiles.team 을 읽는다 (이미 있는 테이블)
 * 같은 응원팀 팬의 글만 보여 주기 위해 목록을 불러오기 전에 먼저 부른다.
 */
export async function getMyTeam() {
    try {
        const {data: auth} = await supabase.auth.getUser()
        const {data, error} = await supabase
            .from(DB.PROFILES)
            .select('team')
            .eq('id', auth.user.id)
            .single()
        if (error) throw error
        return data.team
    } catch (error) {
        // 샘플 데이터 모드에서는 프로필을 못 읽어도 화면을 볼 수 있게 LG로 대신한다
        if (USE_MOCK) return 'LG'
        throw error
    }
}

// 목록과 개수 세기에서 같이 쓰는 조건 (같은 팀 · 날짜 · 모집 중만)
function filteredPosts(select, options, {team, date, openOnly}) {
    let query = supabase.from(DB.POST_LIST).select(select, options).eq('team', team)
    if (date) {
        // 날짜를 골랐으면 그날 경기의 글만
        const [from, to] = dayRange(date)
        query = query.gte('game_at', from.toISOString()).lt('game_at', to.toISOString())
    } else {
        // 전체 날짜면 오늘 이후 경기의 글만 (지난 경기 글은 목록에 안 보인다)
        query = query.gte('game_at', todayStart().toISOString())
    }
    if (openOnly) query = query.eq('is_open', true)
    return query
}

/**
 * 🔌 모집 글 목록 한 페이지 · DB.POST_LIST 뷰를 읽는다
 * @param {{team: string, date: Date | null, openOnly: boolean, sort: 'new' | 'old', page: number}} filters
 * @returns {Promise<{items: object[], hasMore: boolean}>} hasMore: 다음 페이지가 더 있는지 (무한 스크롤)
 */
export async function getMatePosts(filters) {
    if (USE_MOCK) return mock.getMatePosts(filters)

    const from = filters.page * PAGE_SIZE
    // 한 개를 더 달라고 해서(range 끝 = from + PAGE_SIZE) 받은 개수로 다음 페이지가 있는지 판단한다
    const {data, error} = await filteredPosts('*', undefined, filters)
        .order('created_at', {ascending: filters.sort === 'old'})
        .range(from, from + PAGE_SIZE)
    if (error) throw error
    return {items: data.slice(0, PAGE_SIZE).map(toPost), hasMore: data.length > PAGE_SIZE}
}

/**
 * 🔌 조건에 맞는 모집 글 개수 · 날짜 달력의 "10.22 모집 글 2개 보기" 버튼 문구에 쓴다
 * @param {{team: string, date: Date, openOnly: boolean}} filters
 */
export async function countMatePosts(filters) {
    if (USE_MOCK) return mock.countMatePosts(filters)

    // head: true → 글 내용은 받지 않고 개수만 받는다
    const {count, error} = await filteredPosts('id', {count: 'exact', head: true}, filters)
    if (error) throw error
    return count
}

/**
 * 🔌 내 팀 경기 일정 · DB.GAMES 테이블을 읽는다
 * 날짜 달력의 빨간 점(내 팀 경기 날), 날짜 버튼 문구("LG vs 두산")에 쓴다.
 * @param {{team: string, from: Date, to: Date}} range [from, to) 기간의 경기
 */
export async function getTeamGames({team, from, to}) {
    if (USE_MOCK) return mock.getTeamGames({team, from, to})

    const {data, error} = await supabase
        .from(DB.GAMES)
        .select('id, game_at, home_team, away_team, stadium_name')
        .or(`home_team.eq.${team},away_team.eq.${team}`) // 내 팀이 홈이거나 원정인 경기
        .gte('game_at', from.toISOString())
        .lt('game_at', to.toISOString())
        .order('game_at')
    if (error) throw error
    return data.map(toGame)
}
