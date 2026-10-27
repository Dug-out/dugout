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

// public.games.stadium(짧은 구장 이름 텍스트) → stadiums.code. games는 코드가 아니라 이 이름만 갖고 있어서
// 날씨·대기질·맛집 조회에 필요한 위경도를 찾으려면 먼저 이 매핑으로 코드를 알아내야 한다.
export const STADIUM_CODE_BY_NAME = {
    '잠실야구장': 'JAMSIL',
    'KT위즈파크': 'SUWON',
    '고척스카이돔': 'GOCHEOK',
    'SSG랜더스필드': 'INCHEON',
    '한화생명 볼파크': 'DAEJEON',
    '라이온즈파크': 'DAEGU',
    '챔피언스필드': 'GWANGJU',
    'NC파크': 'CHANGWON',
    '사직야구장': 'BUSAN',
}

// 구장 10곳의 정적 참고 정보(위경도·교통) — supabase/schema_ai_planner.sql의 stadiums 테이블과 값을 맞춘다.
// transit_minutes·transit_line이 'TODO'인 곳은 아직 실제 값 확인 전 (팀 확인 필요).
export const MOCK_STADIUMS = {
    JAMSIL: {name: '잠실야구장', transit_minutes: 40, transit_line: '2호선 종합운동장역', lat: 37.512150, lng: 127.071976},
    SUWON: {name: '수원 KT위즈파크', transit_minutes: 65, transit_line: '분당선 수원시청역', lat: 37.299759, lng: 127.009781},
    GOCHEOK: {name: '고척스카이돔', transit_minutes: 0, transit_line: 'TODO', lat: 37.498333, lng: 126.866667},
    INCHEON: {name: '인천 SSG랜더스필드', transit_minutes: 0, transit_line: 'TODO', lat: 37.435139, lng: 126.690806},
    DAEJEON: {name: '대전 한화생명볼파크', transit_minutes: 0, transit_line: 'TODO', lat: 36.317000, lng: 127.389100},
    DAEGU: {name: '대구 삼성라이온즈파크', transit_minutes: 0, transit_line: 'TODO', lat: 35.841110, lng: 128.681670},
    GWANGJU: {name: '광주 기아챔피언스필드', transit_minutes: 0, transit_line: 'TODO', lat: 35.168339, lng: 126.888992},
    CHANGWON: {name: '창원NC파크', transit_minutes: 0, transit_line: 'TODO', lat: 35.222500, lng: 128.582200},
    BUSAN: {name: '부산 사직야구장', transit_minutes: 0, transit_line: 'TODO', lat: 35.194077, lng: 129.061584},
}
