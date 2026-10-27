// 승부 예측 화면에서 쓰는 계산 · 글자 함수 모음
import {SIGNUP} from '../constants/policy.js'

/** 예측 마감 · 경기 시작 1시간 전 (DB 는 시작 시각까지 받지만 화면에서 1시간 전에 막는다) */
export const CLOSE_BEFORE_MS = 60 * 60 * 1000

/** 스코어 범위 · DB 규칙(0~30)과 같다 */
export const SCORE_MIN = 0
export const SCORE_MAX = 30

/** 팀 코드 → 팀 정보(짧은 이름 · 로고) · 없으면 코드만 */
export const teamOf = (code) => SIGNUP.TEAMS.find((team) => team.code === code) ?? {code, label: code, icon: null}

/** 내 팀 점수 : 상대 점수 → 'win' | 'draw' | 'lose' */
export const outcomeOf = (my, opp) => (my > opp ? 'win' : my < opp ? 'lose' : 'draw')

/** 결과 글자 · 'LG 승리' / '무승부' / 'LG 패배' */
export const outcomeLabel = (outcome, teamLabel) =>
    outcome === 'draw' ? '무승부' : `${teamLabel} ${outcome === 'win' ? '승리' : '패배'}`

/** 스코어 → '승 5 : 3' / '무 3 : 3' / '패 2 : 4' (내 팀 기준) */
export const scoreText = ({my, opp}) => `${{win: '승', draw: '무', lose: '패'}[outcomeOf(my, opp)]} ${my} : ${opp}`

/** 날짜 → '10.22' (예측 내역 줄) */
export const formatMonthDay = (value) => {
    const d = new Date(value)
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 비율(%) · 전체가 0이면 0 (0으로 나누지 않게) */
export const percentOf = (count, total) => (total > 0 ? Math.round((count / total) * 100) : 0)

/** 남은 시간(ms) → [시, 분, 초] · 하루가 넘으면 시간을 이어서 센다 */
const splitTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    return [Math.floor(totalSeconds / 3600), Math.floor((totalSeconds % 3600) / 60), totalSeconds % 60]
}

/** 남은 시간 → '9:12:40' (하루가 넘으면 '33:12:40') */
export const formatCountdown = (ms) => {
    const [hours, minutes, seconds] = splitTime(ms)
    const pad = (n) => String(n).padStart(2, '0')
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
}

/** 남은 시간 → 화면 읽기 프로그램용 '9시간 12분 40초' */
export const countdownText = (ms) => {
    const [hours, minutes, seconds] = splitTime(ms)
    return `${hours}시간 ${minutes}분 ${seconds}초`
}
