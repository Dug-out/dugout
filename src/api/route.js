// 대중교통 경로 · ODsay 길찾기 API (브라우저에서 바로 부른다)
// 키(VITE_ODSAY_API_KEY)는 브라우저에 실리는 공개용 키이고, ODsay 콘솔에서 웹 플랫폼으로 쓰는 주소(localhost, 배포 주소)를 등록해 둔다
import {SUBWAY_LINES} from '../constants/subwayLines.js'

const ENDPOINT = 'https://api.odsay.com/v1/api/searchPubTransPathT'

// ODsay 구간 종류 (subPath.trafficType) · 1 지하철, 2 버스, 3 걷기 (시내 경로에서 그 밖은 버스처럼 보여 준다)
// 시외 경로(searchType 1)는 4 기차, 5 고속버스, 6 시외버스(고속버스가 아니면 시외버스), 7 항공이 역·터미널 사이만 온다
const SUBWAY = 1
const WALK = 3
const TRAIN = 4
const EXPRESS_BUS = 5
const AIR = 7

/** 역·정류장 이름 → 괄호 안 보충 설명을 뺀 짧은 이름 · '서울대입구(관악구청)' → '서울대입구' */
const shortStop = (name) => name.replace(/\s*\(.*?\)/g, '').trim() || name

/** 노선 이름 → 짧은 이름 · '수도권 2호선' → '2호선' */
const shortLane = (name) => name.trim().split(/\s+/).pop()

/** 노선 이름 → 색 이름표 · 모르는 노선이면 null (화면이 기본 남색으로 보여 준다) */
const lineOf = (name) => SUBWAY_LINES[name.trim().replace(/^수도권\s+/, '')] ?? null

/**
 * ODsay 응답 → 화면에서 쓰는 경로 · 가장 추천하는 경로 하나만 쓴다
 * @param {any} data ODsay 응답
 * @param {string} destination 마지막 걷기 구간의 도착지 이름 · 구장까지 가는 경로면 '구장', 시외 역·터미널까지 가는 경로면 그 이름
 * @returns {{total: number, legs:  {type: 'walk' | 'subway' | 'bus' | 'train' | 'coach', name: string | null, line?: string | null, title: string, to: string | null, note: string | null, min: number}[], partial?: boolean}}
 *  total: 총 소요 시간(분) / legs: 구간 목록 (걷기 · 지하철 · 버스, 시외는 기차 · 고속·시외버스) · 소요 시간이 0분인 구간은 뺀다
 *  title: 탑승지(걷기는 설명) / to: 내리는 곳(걷기는 null) · 두 줄로 나눠 보여 준다
 *  partial: 시외 구간만 있고 출발지·구장까지의 이동은 빠졌다는 표시
 */
export function parseRoute(data, destination = '구장') {
    // 오류는 {error: [{code, message}]} 또는 {error: {msg}} 로 온다
    const error = Array.isArray(data?.error) ? data.error[0] : data?.error
    const path = data?.result?.path?.[0]
    if (!path) throw new Error(error?.message ?? error?.msg ?? '경로를 찾지 못했어요')
    // 시외 이동(searchType 1)은 구간 모양이 달라서 parseIntercity 가 따로 읽는다
    if (data.result.searchType === 1) throw new Error('시외 이동 경로예요')

    const parts = path.subPath.filter((part) => part.sectionTime > 0)

    const legs = parts.map((part) => {
        const min = part.sectionTime
        if (part.trafficType === SUBWAY) {
            return {
                type: 'subway',
                name: shortLane(part.lane[0].name),
                line: lineOf(part.lane[0].name),
                title: shortStop(part.startName),
                to: shortStop(part.endName),
                note: `${part.stationCount}개 역 이동`,
                min,
            }
        }
        if (part.trafficType !== WALK) {
            // 버스와 그 밖의 탈것(마을버스, 철도 등)은 같은 모양으로 보여 준다
            const lane = part.lane?.[0] ?? {}
            return {
                type: 'bus',
                name: lane.busNo ?? shortLane(lane.name ?? '이동'),
                title: shortStop(part.startName),
                to: shortStop(part.endName),
                note: `${part.stationCount}개 정류장 이동`,
                min,
            }
        }
        // 걷기 · 탑승 전이면 첫 탑승지까지, 마지막 탑승 뒤면 구장까지, 탑승 사이면 환승
        const index = parts.indexOf(part)
        const before = parts.slice(0, index).some((other) => other.trafficType !== WALK)
        const after = parts.slice(index + 1).find((other) => other.trafficType !== WALK)
        const title =
            !before && after ? `${shortStop(after.startName)}까지` : !after ? `${destination}까지` : '환승 이동'
        return {type: 'walk', name: null, title, to: null, note: null, min}
    })

    return {total: path.info.totalTime, legs}
}

/** 시외 구간 한 줄 설명 · '37,500원 · 배차 23분' (없는 값은 뺀다) */
const intercityNote = (part) =>
    [
        part.payment > 0 && `${part.payment.toLocaleString('ko-KR')}원`,
        part.intervalTime > 0 && `배차 ${part.intervalTime}분`,
    ]
        .filter(Boolean)
        .join(' · ') || null

/**
 * ODsay 시외 응답(searchType 1) → 역·터미널 사이 구간 · 항공이 낀 경로는 빼고 가장 빨리 가는 경로 하나를 쓴다
 * 시외 경로에는 출발지에서 역·터미널까지, 역·터미널에서 구장까지의 이동이 없어서 그 지점 좌표(start, end)도 함께 준다
 * @param {any} data ODsay 응답
 * @returns {{total: number, legs: {type: 'train' | 'coach', name: string, title: string, to: string, note: string | null, min: number}[], start: {lat: number, lng: number}, end: {lat: number, lng: number}}}
 */
export function parseIntercity(data) {
    const paths = (data?.result?.path ?? []).filter((path) => !path.subPath.some((part) => part.trafficType === AIR))
    if (paths.length === 0) throw new Error('시외 경로를 찾지 못했어요')
    const path = paths.reduce((best, other) => (other.info.totalTime < best.info.totalTime ? other : best))

    const legs = path.subPath.map((part) => ({
        type: part.trafficType === TRAIN ? 'train' : 'coach',
        name: part.trafficType === TRAIN ? '기차' : part.trafficType === EXPRESS_BUS ? '고속버스' : '시외버스',
        title: shortStop(part.startName),
        to: shortStop(part.endName),
        note: intercityNote(part),
        min: part.sectionTime,
    }))
    const first = path.subPath[0]
    const last = path.subPath[path.subPath.length - 1]
    return {
        total: path.info.totalTime,
        legs,
        start: {lat: first.startY, lng: first.startX},
        end: {lat: last.endY, lng: last.endX},
    }
}

/** ODsay 길찾기 호출 · 키가 없거나 응답이 실패하면 거절된다 */
async function requestRoute(from, to) {
    const key = import.meta.env.VITE_ODSAY_API_KEY
    if (!key) throw new Error('ODsay 키가 없어요')

    const query = `SX=${from.lng}&SY=${from.lat}&EX=${to.lng}&EY=${to.lat}&apiKey=${encodeURIComponent(key)}`
    const response = await fetch(`${ENDPOINT}?${query}`)
    if (!response.ok) throw new Error(`ODsay ${response.status}`)
    return response.json()
}

/**
 * 출발지에서 도착지까지 대중교통 경로 · 키가 없거나 호출이 실패하면 거절된다 (호출하는 쪽이 링크로 대신한다)
 * 시외 이동이면 시외 구간을 받은 뒤 출발지 → 역·터미널, 역·터미널 → 도착지를 시내 경로로 따로 받아 이어 붙인다
 * 앞뒤 구간을 못 받으면 시외 구간만 돌려주고 partial 로 표시한다
 * @param {{lat: number, lng: number}} from 출발지
 * @param {{lat: number, lng: number}} to 도착지
 */
export async function getTransitRoute(from, to) {
    const data = await requestRoute(from, to)
    if (data?.result?.searchType !== 1) return parseRoute(data)

    const main = parseIntercity(data)
    const [access, egress] = await Promise.allSettled([
        requestRoute(from, main.start).then((body) => parseRoute(body, main.legs[0].title)),
        requestRoute(main.end, to).then((body) => parseRoute(body)),
    ])
    if (access.status === 'rejected' || egress.status === 'rejected') {
        return {total: main.total, legs: main.legs, partial: true}
    }
    return {
        total: access.value.total + main.total + egress.value.total,
        legs: [...access.value.legs, ...main.legs, ...egress.value.legs],
    }
}
