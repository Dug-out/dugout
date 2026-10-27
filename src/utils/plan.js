// AI 직관 플랜 화면에서 쓰는 계산 · 글자 함수 모음
import {
    ARRIVE_BEFORE_MINUTES,
    GAME_MINUTES,
    POSTSEASON_START,
    POSTSEASON_TICKET,
    STADIUM_CODE_BY_NAME,
    STADIUM_COORDS,
    TICKET_SITES,
} from '../constants/planner.js'
import {formatTime} from './mateFormat.js'

// 경기 시각의 한국 시간 날짜 'YYYY-MM-DD'
const kstDate = (value) => new Date(new Date(value).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

/** 포스트시즌(가을야구) 경기인지 · 시즌별 시작일(POSTSEASON_START) 이후면 true */
export const isPostseason = (gameAt) => {
    const date = kstDate(gameAt)
    const start = POSTSEASON_START[Number(date.slice(0, 4))]
    return Boolean(start) && date >= start
}

/** 이 경기의 티켓 예매처 {name, url} · 포스트시즌은 놀티켓, 정규시즌은 홈팀의 예매처 · 모르는 팀이면 null */
export const ticketOf = ({home, gameAt}) => (isPostseason(gameAt) ? POSTSEASON_TICKET : (TICKET_SITES[home] ?? null))

/** 경기 종료 예상 시각 '21:40' · 시작 시각에 평균 경기 시간을 더한다 */
export const endEstimate = (gameAt) => formatTime(new Date(new Date(gameAt).getTime() + GAME_MINUTES * 60 * 1000))

/** 구장 도착 목표 시각 '18:00' · 경기 시작 ARRIVE_BEFORE_MINUTES 분 전 */
export const arriveAt = (gameAt) => formatTime(new Date(new Date(gameAt).getTime() - ARRIVE_BEFORE_MINUTES * 60 * 1000))

/** 카카오맵 대중교통 길찾기 링크 (출발지 → 구장) · 구장 위치를 모르면 null · /by/traffic 이 대중교통이고 /link/from 은 자동차 길로 열린다 */
export const routeLink = (origin, stadium) => {
    const coords = STADIUM_COORDS[STADIUM_CODE_BY_NAME[stadium]]
    if (!coords) return null
    const point = (name, {lat, lng}) => `${encodeURIComponent(name)},${lat},${lng}`
    return `https://map.kakao.com/link/by/traffic/${point(origin.label, origin)}/${point(stadium, coords)}`
}
