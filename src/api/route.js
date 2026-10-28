// 대중교통 경로 · ODsay 길찾기 API (브라우저에서 바로 부른다)
// 키(VITE_ODSAY_API_KEY)는 브라우저에 실리는 공개용 키이고, ODsay 콘솔에서 웹 플랫폼으로 쓰는 주소(localhost, 배포 주소)를 등록해 둔다
const ENDPOINT = 'https://api.odsay.com/v1/api/searchPubTransPathT'

// ODsay 구간 종류 (subPath.trafficType) · 1 지하철, 2 버스, 3 걷기 (그 밖은 버스처럼 보여 준다)
const SUBWAY = 1
const WALK = 3

/** 역·정류장 이름 → 괄호 안 보충 설명을 뺀 짧은 이름 · '서울대입구(관악구청)' → '서울대입구' */
const shortStop = (name) => name.replace(/\s*\(.*?\)/g, '').trim() || name

/** 노선 이름 → 짧은 이름 · '수도권 2호선' → '2호선' */
const shortLane = (name) => name.trim().split(/\s+/).pop()

/**
 * ODsay 응답 → 화면에서 쓰는 경로 · 가장 추천하는 경로 하나만 쓴다
 * @param {any} data ODsay 응답
 * @returns {{total: number, legs:  {type: 'walk' | 'subway' | 'bus', name: string | null, title: string, to: string | null, note: string | null, min: number}[]}}
 *  total: 총 소요 시간(분) / legs: 구간 목록 (걷기 · 지하철 · 버스) · 소요 시간이 0분인 구간은 뺀다
 *  title: 탑승지(걷기는 설명) / to: 내리는 곳(걷기는 null) · 두 줄로 나눠 보여 준다
 */
export function parseRoute(data) {
    // 오류는 {error: [{code, message}]} 또는 {error: {msg}} 로 온다
    const error = Array.isArray(data?.error) ? data.error[0] : data?.error
    const path = data?.result?.path?.[0]
    if (!path) throw new Error(error?.message ?? error?.msg ?? '경로를 찾지 못했어요')
    // 시외 이동(searchType 1)은 구간이 시내 경로와 달라서 다루지 않는다 · 호출하는 쪽이 링크로 대신한다
    if (data.result.searchType === 1) throw new Error('시외 이동은 경로를 보여 주지 않아요')

    const parts = path.subPath.filter((part) => part.sectionTime > 0)

    const legs = parts.map((part) => {
        const min = part.sectionTime
        if (part.trafficType === SUBWAY) {
            return {
                type: 'subway',
                name: shortLane(part.lane[0].name),
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
        const title = !before && after ? `${shortStop(after.startName)}까지` : !after ? '구장까지' : '환승 이동'
        return {type: 'walk', name: null, title, to: null, note: null, min}
    })

    return {total: path.info.totalTime, legs}
}

/**
 * 출발지에서 도착지까지 대중교통 경로 · 키가 없거나 호출이 실패하면 거절된다 (호출하는 쪽이 링크로 대신한다)
 * @param {{lat: number, lng: number}} from 출발지
 * @param {{lat: number, lng: number}} to 도착지
 */
export async function getTransitRoute(from, to) {
    const key = import.meta.env.VITE_ODSAY_API_KEY
    if (!key) throw new Error('ODsay 키가 없어요')

    const query = `SX=${from.lng}&SY=${from.lat}&EX=${to.lng}&EY=${to.lat}&apiKey=${encodeURIComponent(key)}`
    const response = await fetch(`${ENDPOINT}?${query}`)
    if (!response.ok) throw new Error(`ODsay ${response.status}`)
    return parseRoute(await response.json())
}
