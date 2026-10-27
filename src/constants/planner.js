// AI 직관 플래너 · 조건 고르기 옵션 (홈 플래너 카드) · value 는 플랜 만들기에 넘기는 값, label 은 칩에 보이는 글자
// short: 플랜 결과의 "고른 조건" 칸에 쓰는 짧은 글자
export const WHEN_OPTIONS = [
    {value: 'weekday', label: '평일 저녁 경기', short: '평일 저녁'},
    {value: 'weekend', label: '주말 경기', short: '주말'},
    {value: 'any', label: '상관 없음', short: '상관 없음'},
]

// 좌석 이름은 모집 글(mate_posts.seat)과 같다
export const SEAT_OPTIONS = [
    {value: 'infield', label: '내야석'},
    {value: 'outfield', label: '외야석'},
    {value: 'cheer', label: '응원석'},
    {value: 'table', label: '테이블석'},
]

// 음식 이름은 구장 안 맛집(stadium_food.category)과 같다
export const FOOD_OPTIONS = [
    {value: 'chicken', label: '치킨'},
    {value: 'pizza', label: '피자·버거'},
    {value: 'cafe', label: '카페·디저트'},
    {value: 'snack', label: '분식·간식'},
    {value: 'korean', label: '한식·고기·주류'},
    {value: 'western', label: '양식·아시안'},
]

// 처음에 골라져 있는 조건
export const DEFAULT_CONDITIONS = {when: 'any', seat: 'cheer', food: 'chicken'}

// 플랜의 출발 위치 · 지도에서 고르는 화면이 생기기 전까지 항상 강남역이다
export const DEFAULT_ORIGIN = {
    lat: 37.498,
    lng: 127.027,
    label: '강남역 2번 출구 근처',
    address: '서울 강남구 강남대로 396',
}

// 추천 경기를 찾는 기간 · 오늘부터 며칠 안의 경기를 후보로 본다
export const PLAN_WINDOW_DAYS = 7

// 경기 한 번에 걸리는 평균 시간(분) · "종료 예상" 시각에 쓴다 (3시간 10분)
export const GAME_MINUTES = 190

// 티켓 예매처 · 정규시즌은 홈팀이 쓰는 곳이 구단마다 다르다 (홈경기 표는 홈팀이 판다)
// 예매처는 구단이 바꿀 수 있어서 시즌 전에 구단 공지로 다시 확인한다 · NC 는 예매처를 확인하지 못해 구단 공식 사이트로 둔다
export const TICKET_SITES = {
    LG: {name: '티켓링크', url: 'https://www.ticketlink.co.kr'},
    한화: {name: '티켓링크', url: 'https://www.ticketlink.co.kr'},
    삼성: {name: '티켓링크', url: 'https://www.ticketlink.co.kr'},
    KT: {name: '티켓링크', url: 'https://www.ticketlink.co.kr'},
    KIA: {name: '티켓링크', url: 'https://www.ticketlink.co.kr'},
    두산: {name: '놀티켓', url: 'https://nol.yanolja.com/ticket'},
    키움: {name: '놀티켓', url: 'https://nol.yanolja.com/ticket'},
    롯데: {name: '롯데 자이언츠 예매', url: 'https://ticket.giantsclub.com'},
    SSG: {name: 'SSG닷컴 티켓', url: 'https://ticket.ssg.com'},
    NC: {name: 'NC 다이노스', url: 'https://www.ncdinos.com'},
}

// 포스트시즌(가을야구)은 어느 팀 경기든 놀티켓에서만 판다
export const POSTSEASON_TICKET = {name: '놀티켓', url: 'https://nol.yanolja.com/ticket/genre/sports/postseason'}

// 시즌별 포스트시즌 시작일(한국 시간) · 이 날부터의 경기는 포스트시즌으로 본다 · 시즌마다 추가한다
export const POSTSEASON_START = {2026: '2026-10-14'}

// 경기 시작 몇 분 전까지 구장에 도착할지
export const ARRIVE_BEFORE_MINUTES = 30

// games.stadium(구장 이름) → stadium_food.stadium_code · 구장 안 맛집을 찾을 때 쓴다 (이름은 supabase/functions/sync-games 의 구장 표와 같다)
export const STADIUM_CODE_BY_NAME = {
    잠실야구장: 'JAMSIL',
    KT위즈파크: 'SUWON',
    고척스카이돔: 'GOCHEOK',
    SSG랜더스필드: 'INCHEON',
    '한화생명 볼파크': 'DAEJEON',
    라이온즈파크: 'DAEGU',
    챔피언스필드: 'GWANGJU',
    NC파크: 'CHANGWON',
    사직야구장: 'BUSAN',
}
