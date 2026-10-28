// 대중교통 경로 · ODsay 길찾기 API (브라우저에서 바로 부른다)
// 키(VITE_ODSAY_API_KEY)는 브라우저에 실리는 공개용 키이고, ODsay 콘솔에서 웹 플랫폼으로 쓰는 주소(localhost, 배포 주소)를 등록해 둔다
const ENDPOINT = 'https://api.odsay.com/v1/api/searchPubTransPathT'

// ODsay 구간 종류 (subPath.trafficType)
const SUBWAY = 1
const BUS = 2
const WALK = 3

/** 노선 이름 → 짧은 이름 · '수도권 2호선' → '2호선' */
const shortLane = (name) => name.trim().split(/\s+/).pop()

/**
 * ODsay 응답 → 화면에서 쓰는 경로 · 가장 추천하는 경로 하나만 쓴다
 * @param {any} data ODsay 응답
 * @returns {{total: number, legs: {type: 'walk' | 'subway' | 'bus', name: string | null, title: string, note: string | null, min: number}[]}}
 *  total: 총 소요 시간(분) / legs: 구간 목록 (걷기 · 지하철 · 버스) · 소요 시간이 0분인 구간은 뺀다
 */
export function parseRoute(data) {
    const path = data?.result?.path?.[0]
    if (!path) throw new Error(data?.error?.msg ?? data?.error?.message ?? '경로를 찾지 못했어요')

    const parts = path.subPath.filter((part) => part.sectionTime > 0)

    const legs = parts.map((part) => {
        const min = part.sectionTime
        if (part.trafficType === SUBWAY) {
            return {
                type: 'subway',
                name: shortLane(part.lane[0].name),
                title: `${part.startName} → ${part.endName}`,
                note: `${part.stationCount}개 역 이동`,
                min,
            }
        }
        if (part.trafficType === BUS) {
            return {
                type: 'bus',
                name: part.lane[0].busNo,
                title: `${part.startName} → ${part.endName}`,
                note: `${part.stationCount}개 정류장 이동`,
                min,
            }
        }
        // 걷기 · 탑승 전이면 첫 탑승지까지, 마지막 탑승 뒤면 구장까지, 탑승 사이면 환승
        const index = parts.indexOf(part)
        const before = parts.slice(0, index).some((other) => other.trafficType !== WALK)
        const after = parts.slice(index + 1).find((other) => other.trafficType !== WALK)
        const title = !before && after ? `${after.startName}까지` : !after ? '구장까지' : '환승 이동'
        return {type: 'walk', name: null, title, note: null, min}
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
