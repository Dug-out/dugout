import {supabase} from '../lib/supabase.js'

/** stadium_food 등이 아직 Supabase에 없을 때(schema_stadium_food.sql 미실행)만 나는 에러 */
const isMissingTable = (error) => error.code === 'PGRST205' || error.code === '42P01'

/**
 * 구장 "내" 맛집 — 사람이 직접 확인한 stadium_food 테이블 조회 (supabase/schema_stadium_food.sql).
 * 테이블이 아직 없으면 빈 배열 — 호출부가 "구장 주변"(카카오 로컬 API) 결과만으로 대신 보여준다.
 */
export async function fetchIndoorStadiumFood(stadiumCode) {
    const {data, error} = await supabase.from('stadium_food').select('*').eq('stadium_code', stadiumCode)
    if (!error) return data
    if (isMissingTable(error)) return []
    throw error
}

/**
 * 구장 "주변" 맛집 · 카페 — 구장 위경도 반경 내를 카카오 로컬 API(Edge Function `stadium-food`)로
 * 실시간 조회한다. stadiumCode를 같이 넘기면 "구장 내" 목록과 이름이 겹치는 결과는 Edge Function이
 * 서버에서 미리 빼고 내려준다. 위경도가 없거나 API가 실패하면 null — 호출부가 빈 목록으로 대신 보여준다.
 */
export async function fetchNearbyStadiumFood({lat, lng, stadiumCode}) {
    if (lat == null || lng == null) return null
    const {data, error} = await supabase.functions.invoke('stadium-food', {body: {lat, lng, stadiumCode}})
    if (error) throw error
    return data?.spots ?? []
}
