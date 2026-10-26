// AI 직관 플래너 · 조건 칩 옵션 + 좌석/예산 매핑
// 추천 점수·이유는 LLM이 아니라 supabase/schema_ai_planner.sql 더미 데이터를 규칙 기반으로 계산한다.
// 실제 LLM(Edge Function) 연결은 다음 단계 — 지금은 화면·데이터 흐름 테스트용.

export const WHEN_OPTIONS = ['이번 주 아무때나', '주말만', '평일 저녁']
export const WITH_OPTIONS = ['혼자', '친구랑', '메이트 구해요']
export const SEAT_OPTIONS = ['응원석', '테이블석', '조용한 자리']
export const BUDGET_OPTIONS = ['2만원 이하', '4만원 이하', '상관없음']
// 구장 맛집 추천 순서 · "추천 이유"에 반영. MOCK_STADIUM_FOOD의 category 값과 맞춘다.
export const FOOD_OPTIONS = ['치킨', '고기', '카페', '상관없음']

export const DEFAULT_CONDITIONS = {
    when: WHEN_OPTIONS[0],
    with: WITH_OPTIONS[1],
    seat: SEAT_OPTIONS[0],
    budget: BUDGET_OPTIONS[1],
    food: FOOD_OPTIONS[3],
}

// 플래너의 "좌석" 조건 → game_seats.seat_type (모집 글 좌석 종류와 같은 값)
export const SEAT_TYPE_BY_PREF = {
    '응원석': '응원석',
    '테이블석': '테이블석',
    '조용한 자리': '내야석',
}

export const BUDGET_MAX = {
    '2만원 이하': 20000,
    '4만원 이하': 40000,
    '상관없음': Infinity,
}

// 직관 준비 체크리스트 · 홈 "내 다음 직관" 카드와 "플랜" 탭 목록에서 같이 쓴다.
export const PREP_ITEMS = [
    {key: 'ticket', label: '티켓'},
    {key: 'mate', label: '메이트'},
    {key: 'food', label: '먹거리'},
    {key: 'transit', label: '교통'},
]

// ai_games 등 Supabase 더미 테이블이 아직 안 만들어졌을 때(schema_ai_planner.sql 미실행)
// fetchUpcomingGames가 대신 쓰는 로컬 더미. supabase/schema_ai_planner.sql의 insert 값과 똑같이 맞춘다.
// 테이블이 생기면 실제 쿼리가 성공하므로 이 더미는 자동으로 안 쓰인다.
export const MOCK_STADIUMS = {
    JAMSIL: {name: '잠실야구장', transit_minutes: 40, transit_line: '2호선 종합운동장역'},
    SUWON: {name: '수원 KT위즈파크', transit_minutes: 65, transit_line: '분당선 수원시청역'},
}

// 구장별 맛집/카페 더미 (실데이터 수집 전까지 사용). 구장 코드로 묶어서 "추천 이유"와
// "구장 맛집 · 카페" 섹션, 직관 타임라인의 "먹거리 픽업" 항목에 함께 쓴다.
export const MOCK_STADIUM_FOOD = {
    JAMSIL: [
        {name: '잠실 치킨런', category: '치킨', walk_min: 3, rating: 4.6, price: '1.8만원~'},
        {name: '잠실 숯불갈비', category: '고기', walk_min: 6, rating: 4.5, price: '2.3만원~'},
        {name: '잠실 커피정거장', category: '카페', walk_min: 2, rating: 4.4, price: '5천원~'},
    ],
    SUWON: [
        {name: '수원 왕통닭', category: '치킨', walk_min: 4, rating: 4.5, price: '1.9만원~'},
        {name: 'KT위즈파크 숯불구이', category: '고기', walk_min: 5, rating: 4.5, price: '2.2만원~'},
        {name: '구장 앞 커피카', category: '카페', walk_min: 2, rating: 4.3, price: '5천원~'},
    ],
}

export const MOCK_AI_GAMES = [
    {
        id: 'mock-g1', game_date: '2026-10-22', start_time: '18:30:00', home_team: 'LG', away_team: '두산',
        stadium_code: 'JAMSIL', home_pitcher_name: '임찬규', home_pitcher_era: 3.12,
        away_pitcher_name: '곽빈', away_pitcher_era: 3.45, pitcher_status: '확정', home_win_pct: 58,
        weather_desc: '맑음', weather_temp: 18, rain_chance: 10,
        stadiums: MOCK_STADIUMS.JAMSIL,
        game_seats: [
            {id: 'mock-s1', zone: '1루 응원석', seat_type: '응원석', price: 38000, total_count: 40, remaining_count: 6, note: '2연석 가능'},
            {id: 'mock-s2', zone: '테이블석', seat_type: '테이블석', price: 55000, total_count: 20, remaining_count: 3, note: null},
        ],
    },
    {
        id: 'mock-g2', game_date: '2026-10-23', start_time: '18:30:00', home_team: 'KT', away_team: 'LG',
        stadium_code: 'SUWON', home_pitcher_name: '엄상백', home_pitcher_era: 3.80,
        away_pitcher_name: '케이시 켈리', away_pitcher_era: 3.20, pitcher_status: '예상', home_win_pct: 45,
        weather_desc: '흐림', weather_temp: 16, rain_chance: 30,
        stadiums: MOCK_STADIUMS.SUWON,
        game_seats: [
            {id: 'mock-s3', zone: '외야석', seat_type: '외야석', price: 25000, total_count: 60, remaining_count: 22, note: null},
            {id: 'mock-s4', zone: '내야석', seat_type: '내야석', price: 45000, total_count: 30, remaining_count: 5, note: null},
        ],
    },
    {
        id: 'mock-g3', game_date: '2026-10-24', start_time: '18:30:00', home_team: 'KT', away_team: 'LG',
        stadium_code: 'SUWON', home_pitcher_name: '고영표', home_pitcher_era: 3.55,
        away_pitcher_name: '임찬규', away_pitcher_era: 3.12, pitcher_status: '예상', home_win_pct: 48,
        weather_desc: '맑음', weather_temp: 15, rain_chance: 10,
        stadiums: MOCK_STADIUMS.SUWON,
        game_seats: [
            {id: 'mock-s5', zone: '3루 응원석', seat_type: '응원석', price: 36000, total_count: 40, remaining_count: 15, note: '2연석 가능'},
            {id: 'mock-s6', zone: '내야석', seat_type: '내야석', price: 42000, total_count: 25, remaining_count: 2, note: null},
        ],
    },
    {
        id: 'mock-g4', game_date: '2026-10-25', start_time: '17:00:00', home_team: 'KT', away_team: 'LG',
        stadium_code: 'SUWON', home_pitcher_name: '웨스 벤자민', home_pitcher_era: 3.40,
        away_pitcher_name: '최원태', away_pitcher_era: 3.90, pitcher_status: '예상', home_win_pct: 40,
        weather_desc: '맑음', weather_temp: 14, rain_chance: 0,
        stadiums: MOCK_STADIUMS.SUWON,
        game_seats: [
            {id: 'mock-s7', zone: '1루 응원석', seat_type: '응원석', price: 36000, total_count: 40, remaining_count: 1, note: '거의 매진'},
            {id: 'mock-s8', zone: '테이블석', seat_type: '테이블석', price: 58000, total_count: 15, remaining_count: 0, note: null},
        ],
    },
    // LG·두산·KT 팬 외 다른 팀으로 테스트할 때도 추천이 뜨도록, 나머지 7개 팀도 한 경기씩 끼워 둔다.
    {
        id: 'mock-g5', game_date: '2026-10-26', start_time: '18:30:00', home_team: 'KIA', away_team: '삼성',
        stadium_code: 'JAMSIL', home_pitcher_name: '양현종', home_pitcher_era: 3.25,
        away_pitcher_name: '원태인', away_pitcher_era: 3.05, pitcher_status: '예상', home_win_pct: 52,
        weather_desc: '맑음', weather_temp: 20, rain_chance: 5,
        stadiums: MOCK_STADIUMS.JAMSIL,
        game_seats: [
            {id: 'mock-s9', zone: '1루 응원석', seat_type: '응원석', price: 37000, total_count: 40, remaining_count: 18, note: null},
            {id: 'mock-s10', zone: '내야석', seat_type: '내야석', price: 43000, total_count: 30, remaining_count: 10, note: null},
        ],
    },
    {
        id: 'mock-g6', game_date: '2026-10-27', start_time: '18:30:00', home_team: '롯데', away_team: '한화',
        stadium_code: 'SUWON', home_pitcher_name: '박세웅', home_pitcher_era: 3.30,
        away_pitcher_name: '류현진', away_pitcher_era: 2.95, pitcher_status: '예상', home_win_pct: 47,
        weather_desc: '흐림', weather_temp: 17, rain_chance: 40,
        stadiums: MOCK_STADIUMS.SUWON,
        game_seats: [
            {id: 'mock-s11', zone: '외야석', seat_type: '외야석', price: 24000, total_count: 60, remaining_count: 30, note: null},
            {id: 'mock-s12', zone: '테이블석', seat_type: '테이블석', price: 54000, total_count: 20, remaining_count: 8, note: null},
        ],
    },
    {
        id: 'mock-g7', game_date: '2026-10-28', start_time: '17:00:00', home_team: 'SSG', away_team: 'NC',
        stadium_code: 'JAMSIL', home_pitcher_name: '김광현', home_pitcher_era: 3.10,
        away_pitcher_name: '신민혁', away_pitcher_era: 3.40, pitcher_status: '예상', home_win_pct: 55,
        weather_desc: '맑음', weather_temp: 16, rain_chance: 0,
        stadiums: MOCK_STADIUMS.JAMSIL,
        game_seats: [
            {id: 'mock-s13', zone: '3루 응원석', seat_type: '응원석', price: 35000, total_count: 40, remaining_count: 20, note: null},
            {id: 'mock-s14', zone: '내야석', seat_type: '내야석', price: 41000, total_count: 25, remaining_count: 12, note: null},
        ],
    },
    {
        id: 'mock-g8', game_date: '2026-10-29', start_time: '18:30:00', home_team: '키움', away_team: '삼성',
        stadium_code: 'SUWON', home_pitcher_name: '안우진', home_pitcher_era: 3.00,
        away_pitcher_name: '코너 시볼드', away_pitcher_era: 3.65, pitcher_status: '예상', home_win_pct: 44,
        weather_desc: '맑음', weather_temp: 15, rain_chance: 10,
        stadiums: MOCK_STADIUMS.SUWON,
        game_seats: [
            {id: 'mock-s15', zone: '1루 응원석', seat_type: '응원석', price: 33000, total_count: 40, remaining_count: 25, note: null},
            {id: 'mock-s16', zone: '테이블석', seat_type: '테이블석', price: 50000, total_count: 20, remaining_count: 6, note: null},
        ],
    },
]
