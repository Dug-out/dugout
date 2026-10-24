// 메이트 화면에서 쓰는 글자 만들기 함수 모음 (날짜 · 시간 · 경기 이름)

// 요일 글자 · Date.getDay()가 0(일)~6(토)을 돌려준다
const DAYS = ['일', '월', '화', '수', '목', '금', '토']

// 숫자를 두 자리로 (9 → '09') · 디자인 "09.27", "18:30" 모양
const pad = (n) => String(n).padStart(2, '0')

/** 날짜 → '10.22 (목)' */
export const formatDay = (value) => {
    const d = new Date(value)
    return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${DAYS[d.getDay()]})`
}

/** 시각 → '18:30' */
export const formatTime = (value) => {
    const d = new Date(value)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 경기 → 'LG vs 두산' · 내 팀이 뛰는 경기면 내 팀을 앞에 쓴다 */
export const matchLabel = (game, myTeam) =>
    game.away === myTeam ? `${game.away} vs ${game.home}` : `${game.home} vs ${game.away}`
