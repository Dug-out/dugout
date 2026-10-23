// 메이트 찾기 화면에서 쓰는 글자 만들기 함수 모음 (날짜 · 팀 이름 · 조건 태그)
// 화면 여러 곳(목록 카드 · 날짜 버튼 · 달력)에서 같은 모양으로 보이도록 한곳에 모았다.
import {SIGNUP} from '../../constants/policy.js'

/** 요일 글자 · Date.getDay()가 0(일)~6(토)을 돌려준다 */
export const DAYS = ['일', '월', '화', '수', '목', '금', '토']

// 숫자를 두 자리로 (9 → '09') · 디자인 "09.27", "18:30" 모양
const pad = (n) => String(n).padStart(2, '0')

// 팀 코드 → 이름 · 팀 목록은 기존 policy.js 의 SIGNUP.TEAMS 를 그대로 쓴다
const findTeam = (code) => SIGNUP.TEAMS.find((t) => t.code === code)
/** 짧은 이름 'LG', '두산' · "LG vs 두산"에 쓴다 */
export const teamLabel = (code) => findTeam(code)?.label ?? code
/** 긴 이름 'LG 트윈스' · "LG 트윈스 팬만 보여요"에 쓴다 */
export const teamName = (code) => findTeam(code)?.name ?? code

/** 그날 0시 */
export const startOfDay = (value) => {
    const d = new Date(value)
    d.setHours(0, 0, 0, 0)
    return d
}
/** 오늘 0시 */
export const todayStart = () => startOfDay(new Date())
/** 같은 날인지 (시각은 무시) */
export const isSameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime()
/** 그 달 1일 0시 · 달력의 "지금 보고 있는 달" */
export const startOfMonth = (value) => {
    const d = startOfDay(value)
    d.setDate(1)
    return d
}
/** months달 뒤의 1일 (음수면 앞 달) */
export const addMonths = (value, months) => {
    const d = startOfMonth(value)
    d.setMonth(d.getMonth() + months)
    return d
}

/** '10.22' */
export const formatMonthDay = (value) => {
    const d = new Date(value)
    return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}
/** '10.22 (목)' */
export const formatDay = (value) => `${formatMonthDay(value)} (${DAYS[new Date(value).getDay()]})`
/** '18:30' */
export const formatTime = (value) => {
    const d = new Date(value)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
/** '2026.10' · 달력 제목 */
export const formatYearMonth = (value) => {
    const d = new Date(value)
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}`
}

/** 경기에서 내 팀의 상대팀 코드 (내가 홈이면 원정 팀, 원정이면 홈 팀) */
export const opponentOf = (game, team) => (game.home === team ? game.away : game.home)
/** 'LG vs 두산' · 내 팀을 항상 앞에 쓴다 (디자인: 원정 경기도 "LG vs KT") */
export const matchLabel = (game, team) => `${teamLabel(team)} vs ${teamLabel(opponentOf(game, team))}`

/** 경기까지 남은 날 'D-3' · 오늘이면 'D-day' */
export function formatDday(value) {
    const days = Math.round((startOfDay(value) - todayStart()) / 86400000) // 86400000 = 하루(ms)
    if (days === 0) return 'D-day'
    return days > 0 ? `D-${days}` : `D+${-days}`
}

/**
 * 모집 조건 태그 3개 · 디자인 순서: [좌석] [나이대] [성별]
 * 나이대를 안 골랐으면 '나이 무관', 성별이 무관이면 '성별 무관', 아니면 '여성만'처럼 쓴다.
 */
export const conditionTags = (post) => [
    post.seat,
    post.ages.length ? post.ages.join('·') : '나이 무관',
    post.gender === '무관' ? '성별 무관' : `${post.gender}만`,
]
