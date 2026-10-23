// 메이트 찾기 샘플 데이터 · 개발할 때 화면 모양을 보기 위한 것 (.env 의 VITE_USE_MOCK=true 일 때만 쓰인다)
// DB가 준비되면 쓰이지 않는다. 화면 코드는 src/api/mate.js 만 부르므로 이 파일을 지워도 화면 코드는 그대로다.
//
// 표기 규칙 (팀 약속)
//  - 사람이 쓰는 글 칸 → '○○ 들어갈곳' (실제로는 사용자가 입력한 내용이 들어간다)
//  - 고르는 값(팀·좌석·성별·나이대)과 숫자·날짜 → 실제 값 + 주석 (화면이 이 값으로 거르고 계산하기 때문)
//
// 이 파일의 함수는 src/api/mate.js 와 같은 이름·같은 모양으로 돌려준다.
// → DB 담당자는 이 파일을 "화면이 필요로 하는 데이터 견본"으로 보면 된다.

import {PAGE_SIZE} from '../mate.js'

// 진짜 서버처럼 잠깐 기다렸다가 돌려준다 (불러오는 중 화면 확인용)
const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// 오늘 기준으로 며칠 뒤인지로 날짜를 만든다 → 언제 열어 봐도 "앞으로 열릴 경기"로 보인다
const daysLater = (days, time) => {
    const [h, m] = time.split(':').map(Number)
    const d = new Date()
    d.setDate(d.getDate() + days)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
}

// 내 팀 경기 일정 견본 · 상대팀은 실제 팀 코드, 구장 이름은 '들어갈곳'
// home: true → 내 팀 홈경기 / false → 원정경기
const SCHEDULE = [
    {id: 'g1', days: 0, time: '18:30', opponent: 'DOOSAN', home: true, stadium: '구장 이름 들어갈곳 (홈)'},
    {id: 'g2', days: 1, time: '18:30', opponent: 'DOOSAN', home: true, stadium: '구장 이름 들어갈곳 (홈)'},
    {id: 'g3', days: 2, time: '18:30', opponent: 'KT', home: false, stadium: '구장 이름 들어갈곳 (원정)'},
    {id: 'g4', days: 3, time: '17:00', opponent: 'KT', home: false, stadium: '구장 이름 들어갈곳 (원정)'},
    {id: 'g5', days: 4, time: '14:00', opponent: 'KT', home: false, stadium: '구장 이름 들어갈곳 (원정)'},
    // 5일 뒤는 경기 없는 날 (달력에 빨간 점이 없어야 한다)
    {id: 'g6', days: 6, time: '18:30', opponent: 'KIWOOM', home: true, stadium: '구장 이름 들어갈곳 (홈)'},
    {id: 'g7', days: 7, time: '18:30', opponent: 'KIWOOM', home: true, stadium: '구장 이름 들어갈곳 (홈)'},
    {id: 'g8', days: 9, time: '18:30', opponent: 'HANWHA', home: false, stadium: '구장 이름 들어갈곳 (원정)'},
    {id: 'g9', days: 12, time: '18:30', opponent: 'NC', home: true, stadium: '구장 이름 들어갈곳 (홈)'},
    {id: 'g10', days: 30, time: '18:30', opponent: 'SSG', home: true, stadium: '구장 이름 들어갈곳 (홈)'}, // 다음 달 확인용
]

// 모집 글 견본 · 12개 → 한 페이지(10개)를 넘겨서 무한 스크롤까지 확인할 수 있다
// minutesAgo: 몇 분 전에 올린 글인지 (최신순 · 오래된순 확인용)
// closed: 방장이 직접 모집 마감한 글
const POSTS = [
    {id: 'p1', gameId: 'g2', minutesAgo: 40, title: '모집 글 제목 들어갈곳 — 긴 제목은 이렇게 두 줄로 넘어가요 확인용',
        maxMembers: 4, joinedCount: 2, seat: '응원석', ages: ['20대', '30대'], gender: '무관',
        host: {id: 'u1', nickname: '닉네임 들어갈곳 1', manner: 0.389}},
    {id: 'p2', gameId: 'g2', minutesAgo: 300, title: '모집 글 제목 들어갈곳 2',
        maxMembers: 2, joinedCount: 1, seat: '테이블석', ages: [], gender: '여성',
        host: {id: 'u2', nickname: '닉네임 들어갈곳 2', manner: 0.341}},
    {id: 'p3', gameId: 'g4', minutesAgo: 120, title: '모집 글 제목 들어갈곳 3 (인원이 다 찬 글)',
        maxMembers: 3, joinedCount: 3, seat: '외야석', ages: ['20대'], gender: '무관',
        host: {id: 'u3', nickname: '닉네임 들어갈곳 3', manner: 0.312}},
    {id: 'p4', gameId: 'g7', minutesAgo: 15, title: '모집 글 제목 들어갈곳 4',
        maxMembers: 4, joinedCount: 1, seat: '내야석', ages: [], gender: '남성',
        host: {id: 'u4', nickname: '닉네임 들어갈곳 4', manner: 0.356}},
    {id: 'p5', gameId: 'g1', minutesAgo: 600, title: '모집 글 제목 들어갈곳 5 (방장이 마감한 글)', closed: true,
        maxMembers: 4, joinedCount: 2, seat: '응원석', ages: ['30대', '40대 이상'], gender: '무관',
        host: {id: 'u5', nickname: '닉네임 들어갈곳 5', manner: 0.25}},
    {id: 'p6', gameId: 'g3', minutesAgo: 75, title: '모집 글 제목 들어갈곳 6',
        maxMembers: 6, joinedCount: 3, seat: '외야석', ages: ['10대', '20대'], gender: '무관',
        host: {id: 'u6', nickname: '닉네임 들어갈곳 6', manner: 0.298}},
    {id: 'p7', gameId: 'g6', minutesAgo: 200, title: '모집 글 제목 들어갈곳 7',
        maxMembers: 2, joinedCount: 1, seat: '내야석', ages: [], gender: '무관',
        host: {id: 'u7', nickname: '닉네임 들어갈곳 7', manner: 0.4}},
    {id: 'p8', gameId: 'g8', minutesAgo: 1440, title: '모집 글 제목 들어갈곳 8',
        maxMembers: 10, joinedCount: 4, seat: '응원석', ages: [], gender: '무관',
        host: {id: 'u8', nickname: '닉네임 들어갈곳 8', manner: 0.2}},
    {id: 'p9', gameId: 'g1', minutesAgo: 5, title: '모집 글 제목 들어갈곳 9',
        maxMembers: 3, joinedCount: 1, seat: '테이블석', ages: ['20대'], gender: '여성',
        host: {id: 'u9', nickname: '닉네임 들어갈곳 9', manner: 0.275}},
    {id: 'p10', gameId: 'g9', minutesAgo: 2880, title: '모집 글 제목 들어갈곳 10',
        maxMembers: 4, joinedCount: 2, seat: '내야석', ages: ['30대'], gender: '남성',
        host: {id: 'u10', nickname: '닉네임 들어갈곳 10', manner: 0.333}},
    {id: 'p11', gameId: 'g5', minutesAgo: 90, title: '모집 글 제목 들어갈곳 11',
        maxMembers: 5, joinedCount: 2, seat: '외야석', ages: [], gender: '무관',
        host: {id: 'u11', nickname: '닉네임 들어갈곳 11', manner: 0.312}},
    {id: 'p12', gameId: 'g7', minutesAgo: 4320, title: '모집 글 제목 들어갈곳 12 (마지막 글 · 무한 스크롤 끝 확인용)',
        maxMembers: 2, joinedCount: 1, seat: '응원석', ages: ['40대 이상'], gender: '무관',
        host: {id: 'u12', nickname: '닉네임 들어갈곳 12', manner: 0.261}},
]

// 경기 견본 → 화면 모양 (내 팀 코드를 받아서 홈/원정 자리에 넣는다)
// 이렇게 하면 가입할 때 어떤 팀을 골랐든 "내 팀 vs 상대팀"으로 보인다
function toGame(schedule, team) {
    return {
        id: schedule.id,
        gameAt: daysLater(schedule.days, schedule.time),
        home: schedule.home ? team : schedule.opponent,
        away: schedule.home ? schedule.opponent : team,
        stadium: schedule.stadium,
    }
}

// 모집 글 견본 → 화면 모양 (src/api/mate.js 의 toPost 결과와 같은 모양)
function toPost(post, team) {
    const game = toGame(SCHEDULE.find((s) => s.id === post.gameId), team)
    return {
        id: post.id,
        title: post.title,
        imageUrl: null, // 대표 이미지 들어갈곳 · null이면 기본 이미지(mate-default.png)
        isOpen: !post.closed && post.joinedCount < post.maxMembers, // 마감했거나 인원이 다 차면 모집 마감
        maxMembers: post.maxMembers,
        joinedCount: post.joinedCount,
        seat: post.seat,
        ages: post.ages,
        gender: post.gender,
        createdAt: new Date(Date.now() - post.minutesAgo * 60000).toISOString(),
        game,
        host: {...post.host, avatarUrl: null}, // 프로필 사진 들어갈곳 · null이면 기본 프로필 이미지
    }
}

// src/api/mate.js 와 같은 조건으로 거른다 (날짜 · 오늘 이후 · 모집 중만)
function filtered({team, date, openOnly}) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return POSTS.map((post) => toPost(post, team)).filter((post) => {
        const gameDay = new Date(post.game.gameAt)
        gameDay.setHours(0, 0, 0, 0)
        if (date && gameDay.getTime() !== new Date(date).setHours(0, 0, 0, 0)) return false
        if (!date && gameDay < today) return false
        return !openOnly || post.isOpen
    })
}

export async function getMatePosts({team, date, openOnly, sort, page}) {
    await wait()
    const sorted = filtered({team, date, openOnly}).sort((a, b) =>
        sort === 'old' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt))
    const from = page * PAGE_SIZE
    return {items: sorted.slice(from, from + PAGE_SIZE), hasMore: sorted.length > from + PAGE_SIZE}
}

export async function countMatePosts(filters) {
    await wait(150)
    return filtered(filters).length
}

export async function getTeamGames({team, from, to}) {
    await wait(150)
    return SCHEDULE.map((s) => toGame(s, team))
        .filter((game) => new Date(game.gameAt) >= from && new Date(game.gameAt) < to)
}
