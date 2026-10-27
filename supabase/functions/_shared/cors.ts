// Edge Function 공통 CORS 헤더 — 브라우저(supabase-js)에서 functions.invoke()로 부를 때 필요
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
