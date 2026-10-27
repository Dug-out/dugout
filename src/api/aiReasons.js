import {supabase} from '../lib/supabase.js'

/**
 * "이 경기를 추천한 이유"를 Gemini(Edge Function `plan-recommend`)로 생성한다.
 * 실패하면 null — 호출부가 규칙 기반 buildReasons(src/api/planner.js)로 대신한다.
 */
export async function fetchAiReasons(payload) {
    const {data, error} = await supabase.functions.invoke('plan-recommend', {body: payload})
    if (error) throw error
    if (!data?.reasons) throw new Error('AI 추천 이유를 받지 못했어요')
    return data.reasons
}
