// AI 직관 플래너 "구장 맛집 · 카페" 실데이터 — 카카오 로컬 API(키워드 장소검색)로 구장 좌표 주변을 그때그때 찾아온다.
// 전에는 카카오맵에서 손으로 export한 TSV(잠실·고척 2곳만)였는데, 이 API로 10개 구장 전부를
// 수집 없이 커버할 수 있다. REST API 키는 브라우저에 노출하면 안 되고 카카오 쪽 CORS도 서버 호출을
// 전제로 하므로, Gemini(plan-recommend)와 같은 패턴으로 Edge Function에서만 호출한다.
import {corsHeaders} from '../_shared/cors.ts'

const KEYWORD_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'

// 플래너의 "선호 음식" 조건(src/constants/planner.js FOOD_OPTIONS, supabase/schema_stadium_food_draft.sql
// stadium_food.category와 같은 값) → 카카오 검색 키워드. '·' 앞 단어를 그대로 쓴다.
// '상관없음'은 한 카테고리로 못 좁히니 전부 찾아서 거리순으로 합친다.
const QUERY_BY_FOOD_OPTION: Record<string, string> = {
    '치킨': '치킨',
    '피자·버거': '피자',
    '카페·디저트': '카페',
    '분식·간식': '분식',
    '한식·고기·주류': '한식',
    '양식·아시안': '양식',
}
const ALL_QUERIES = Object.values(QUERY_BY_FOOD_OPTION)

// 500m 안은 거의 다 구장 내 체인점(이미 stadium_food 테이블에 있음)이라, 진짜 "구장 주변"을
// 찾으려면 더 넓게 봐야 한다 — 직접 테스트해보니 진짜 바깥 매장은 550m~ 부터 나왔다.
const RADIUS_M = 1000
const SEARCH_SIZE = 15 // 카카오 키워드 검색 한 페이지 최대치 — 넓혀 봐야 바깥 매장까지 닿는다
const WALK_M_PER_MIN = 67 // 도보 속도(약 4km/h) 가정 — 카카오 응답엔 도보 시간이 없어 거리로 추정

interface KakaoDocument {
    place_name: string
    distance: string // 미터, 문자열
    road_address_name: string
    address_name: string
    phone: string
}

interface FoodSpot {
    name: string
    category: string
    walk_min: number
    address: string
    phone: string | null
}

async function searchKeyword(apiKey: string, query: string, lat: number, lng: number): Promise<KakaoDocument[]> {
    const params = new URLSearchParams({
        query,
        x: String(lng),
        y: String(lat),
        radius: String(RADIUS_M),
        sort: 'distance',
        size: String(SEARCH_SIZE),
    })
    const res = await fetch(`${KEYWORD_SEARCH_URL}?${params}`, {
        headers: {Authorization: `KakaoAK ${apiKey}`},
    })
    if (!res.ok) throw new Error(`카카오 로컬 API 오류 (${res.status}): ${await res.text()}`)
    const data = await res.json()
    return data.documents ?? []
}

function toSpot(doc: KakaoDocument, category: string): FoodSpot {
    return {
        name: doc.place_name,
        category,
        walk_min: Math.max(1, Math.round(Number(doc.distance) / WALK_M_PER_MIN)),
        address: doc.road_address_name || doc.address_name,
        phone: doc.phone || null,
    }
}

/**
 * "구장 내"(stadium_food 테이블, 사람이 직접 확인한 목록)에 이미 있는 이름은 "구장 주변" 결과에서
 * 빼야 한다 — 서비스 롤 키로 조회(이 표는 RLS가 authenticated만 허용해서 anon/publishable 키로는 못 봄).
 * stadium_code를 안 넘겼거나 조회가 실패하면 빈 Set — 이 경우 호출부는 그냥 중복 제거 없이 내려준다.
 */
async function fetchIndoorNames(stadiumCode?: string): Promise<Set<string>> {
    if (!stadiumCode) return new Set()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return new Set()

    const params = new URLSearchParams({select: 'name', stadium_code: `eq.${stadiumCode}`})
    const res = await fetch(`${supabaseUrl}/rest/v1/stadium_food?${params}`, {
        headers: {apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`},
    })
    if (!res.ok) return new Set()
    const rows = (await res.json()) as {name: string}[]
    return new Set(rows.map((r) => r.name))
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {headers: corsHeaders})
    }

    try {
        const apiKey = Deno.env.get('KAKAO_REST_API_KEY')
        if (!apiKey) {
            return new Response(JSON.stringify({error: 'KAKAO_REST_API_KEY가 설정되지 않았어요'}), {
                status: 500,
                headers: {...corsHeaders, 'Content-Type': 'application/json'},
            })
        }

        const {lat, lng, category, stadiumCode} = await req.json()
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new Error('lat·lng이 필요해요')
        }

        const queries = category && QUERY_BY_FOOD_OPTION[category]
            ? [QUERY_BY_FOOD_OPTION[category]]
            : ALL_QUERIES

        const [results, indoorNames] = await Promise.all([
            Promise.all(
                queries.map(async (query) => {
                    const docs = await searchKeyword(apiKey, query, lat, lng)
                    const foodCategory = Object.entries(QUERY_BY_FOOD_OPTION).find(([, q]) => q === query)?.[0] ?? query
                    return docs.map((doc) => toSpot(doc, foodCategory))
                }),
            ),
            fetchIndoorNames(stadiumCode),
        ])

        // "구장 내" 목록(stadium_food 테이블)에 이미 있는 이름은 빼고, 같은 매장이 여러 키워드에
        // 동시에 걸린 경우(예: "치킨집"이 "고기" 검색에도 걸림)도 이름으로 중복 제거한다.
        const seen = new Set<string>()
        const spots = results
            .flat()
            .filter((spot) => {
                if (indoorNames.has(spot.name)) return false
                if (seen.has(spot.name)) return false
                seen.add(spot.name)
                return true
            })
            .sort((a, b) => a.walk_min - b.walk_min)
            .slice(0, 5)

        return new Response(JSON.stringify({spots}), {
            headers: {...corsHeaders, 'Content-Type': 'application/json'},
        })
    } catch (error) {
        console.error('[stadium-food]', error)
        const message = error instanceof Error ? error.message : '알 수 없는 오류'
        return new Response(JSON.stringify({error: message}), {
            status: 500,
            headers: {...corsHeaders, 'Content-Type': 'application/json'},
        })
    }
})
