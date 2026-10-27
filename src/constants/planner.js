// AI 직관 플래너 · 조건 고르기 옵션 (홈 플래너 카드) · value 는 플랜 만들기에 넘기는 값, label 은 칩에 보이는 글자
export const WHEN_OPTIONS = [
    {value: 'weekday', label: '평일 저녁 경기'},
    {value: 'weekend', label: '주말 경기'},
    {value: 'any', label: '상관 없음'},
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
