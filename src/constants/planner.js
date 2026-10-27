// AI 직관 플래너 · 조건 칩 옵션

export const WHEN_OPTIONS = ['평일', '저녁', '아무때나']
export const WITH_OPTIONS = ['메이트 구해요', '친구랑', '데이트', '혼자']
// games엔 좌석 잔여석 데이터가 없어서, 이 값은 화면·Gemini 문구에 쓰는 사용자 선호일 뿐 DB 조회는 안 한다.
export const SEAT_OPTIONS = ['내야석', '외야석', '응원석', '테이블석']
// stadium_food.category(supabase/schema_stadium_food.sql)와 같은 값 — 카카오 로컬 API 검색 키워드와도 맞춘다.
export const FOOD_OPTIONS = ['치킨', '피자·버거', '카페·디저트', '분식·간식', '한식·고기·주류', '양식·아시안', '상관없음']

export const DEFAULT_CONDITIONS = {
    when: '아무때나',
    with: '친구랑',
    seat: '응원석',
    food: '상관없음',
}
