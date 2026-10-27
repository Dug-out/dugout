// 경기 날 날씨 · 대기질 — Open-Meteo (무료, 키 발급 불필요) https://open-meteo.com
// KBO·구단 사이트는 robots.txt로 크롤링이 막혀 있어 선발투수 등은 여전히 더미지만,
// 날씨·대기질은 이 공개 API로 구장 위경도만 있으면 실제 값을 받아올 수 있다.
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

// WMO 날씨 코드(Open-Meteo weathercode) → 한국어 한 줄 요약
const WEATHER_DESC_BY_CODE = {
    0: '맑음',
    1: '대체로 맑음', 2: '구름 조금', 3: '흐림',
    45: '안개', 48: '안개',
    51: '약한 이슬비', 53: '이슬비', 55: '강한 이슬비',
    56: '약한 어는 이슬비', 57: '어는 이슬비',
    61: '약한 비', 63: '비', 65: '강한 비',
    66: '약한 어는 비', 67: '어는 비',
    71: '약한 눈', 73: '눈', 75: '강한 눈', 77: '싸락눈',
    80: '약한 소나기', 81: '소나기', 82: '강한 소나기',
    85: '약한 눈 소나기', 86: '강한 눈 소나기',
    95: '뇌우', 96: '뇌우(약한 우박)', 99: '뇌우(강한 우박)',
}

const weatherDesc = (code) => WEATHER_DESC_BY_CODE[code] ?? '정보 없음'

/** 환경부 기준 등급 — PM10·PM2.5 중 더 나쁜 쪽으로 판단 (㎍/㎥) */
function airGrade(pm10, pm25) {
    const levelOf = (value, breaks) => {
        if (value == null) return 0
        if (value <= breaks[0]) return 1 // 좋음
        if (value <= breaks[1]) return 2 // 보통
        if (value <= breaks[2]) return 3 // 나쁨
        return 4 // 매우나쁨
    }
    const level = Math.max(levelOf(pm10, [30, 80, 150]), levelOf(pm25, [15, 35, 75]))
    return ['정보 없음', '좋음', '보통', '나쁨', '매우나쁨'][level]
}

/**
 * 구장 위경도 + 경기 날짜로 경기 시작 시각에 가장 가까운 날씨·대기질을 가져온다.
 * 위경도가 없거나(아직 수집 전 구장) API가 실패하면 null — 호출부가 기존 더미 값으로 대신한다.
 */
export async function fetchGameWeather({lat, lng, date, startTime}) {
    if (lat == null || lng == null) return null

    const hour = Number((startTime ?? '18:00').slice(0, 2))
    const common = {latitude: lat, longitude: lng, timezone: 'Asia/Seoul', start_date: date, end_date: date}
    const weatherParams = new URLSearchParams({...common, hourly: 'temperature_2m,precipitation_probability,weathercode'})
    const airParams = new URLSearchParams({...common, hourly: 'pm10,pm2_5'})

    const [weatherRes, airRes] = await Promise.all([
        fetch(`${FORECAST_URL}?${weatherParams}`),
        fetch(`${AIR_QUALITY_URL}?${airParams}`),
    ])
    if (!weatherRes.ok) throw new Error(`날씨 API 오류 (${weatherRes.status})`)
    const weather = await weatherRes.json()
    const air = airRes.ok ? await airRes.json() : null

    const idx = weather.hourly?.time?.findIndex((t) => Number(t.slice(11, 13)) === hour) ?? -1
    const pick = (arr) => (idx >= 0 ? arr?.[idx] : arr?.[0])

    const temp = pick(weather.hourly?.temperature_2m)
    const rainChance = pick(weather.hourly?.precipitation_probability)
    const code = pick(weather.hourly?.weathercode)
    const pm10 = air ? pick(air.hourly?.pm10) : null
    const pm25 = air ? pick(air.hourly?.pm2_5) : null

    return {
        weather_desc: weatherDesc(code),
        weather_temp: temp != null ? Math.round(temp) : null,
        rain_chance: rainChance != null ? Math.round(rainChance) : null,
        air_grade: airGrade(pm10, pm25),
        pm10: pm10 != null ? Math.round(pm10) : null,
        pm25: pm25 != null ? Math.round(pm25) : null,
    }
}
