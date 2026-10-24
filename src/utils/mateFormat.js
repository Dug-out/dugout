// 메이트 화면에서 쓰는 글자 만들기 함수 모음 (날짜 · 시간 · 팀 이름)
// 여러 화면에서 같은 모양으로 보이도록 한곳에 모았다.
import {SIGNUP} from '../constants/policy.js'

/** 요일 글자 · Date.getDay()가 0(일)~6(토)을 돌려준다 */
const DAYS = ['일', '월', '화', '수', '목', '금', '토']

// 숫자를 두 자리로 (9 → '09') · 디자인 "09.27", "18:30" 모양
const pad = (n) => String(n).padStart(2, '0')

/** 팀 코드 → 짧은 이름 ('LG', '두산') · 팀 목록은 기존 policy.js 의 SIGNUP.TEAMS 를 그대로 쓴다 */
export const teamLabel = (code) => SIGNUP.TEAMS.find((t) => t.code === code)?.label ?? code

/** '10.22 (목)' */
export const formatDay = (value) => {
    const d = new Date(value)
    return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${DAYS[d.getDay()]})`
}

/** '18:30' */
export const formatTime = (value) => {
    const d = new Date(value)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 'LG vs 두산' · 내 팀이 뛰는 경기면 내 팀을 앞에 쓴다 (디자인: 원정 경기도 "LG vs KT")
 * 내 팀을 모르거나, 내 팀이 없는 경기면 '홈 vs 원정' 그대로 쓴다
 * → 예전에는 내 팀이 없는 경기("두산 vs KIA")도 "LG vs 두산"처럼 내 팀 경기로 잘못 보였다
 */
export const matchLabel = (game, myTeam) => {
    if (game.home === myTeam) return `${teamLabel(game.home)} vs ${teamLabel(game.away)}`
    if (game.away === myTeam) return `${teamLabel(game.away)} vs ${teamLabel(game.home)}`
    return `${teamLabel(game.home)} vs ${teamLabel(game.away)}`
}
