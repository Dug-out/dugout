// AI 직관 플래너 · "이 경기를 추천한 이유"를 Gemini로 생성한다.
// 경기 추천 순위(scoreGame)·조건 일치 체크(matchChecklist)는 그대로 규칙 기반(src/api/planner.js)을 쓰고,
// 이 함수는 그 결과를 바탕으로 사람이 쓴 것처럼 자연스러운 추천 이유 문장만 만든다.
// AI가 없는 사실을 지어내지 않도록, 프롬프트에는 이미 계산된 사실(조건·좌석·날씨·맛집)만 넘긴다.
import {corsHeaders} from '../_shared/cors.ts'

// "latest" 별명이 붙은 lite 모델 — Google이 가리키는 실제 모델을 알아서 갈아 끼워주니
// 특정 버전을 박아두는 것보다 안 끊긴다. 짧은 문장 몇 개만 만들면 되는 작업이라 lite로 충분히 빠르다.
// 필요하면 Supabase secrets에 GEMINI_MODEL로 다른 모델명을 넣어 덮어쓸 수 있다.
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-lite-latest'
const GEMINI_URL = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

interface PlanRecommendRequest {
    teamName: string
    game: {
        date: string
        startTime: string
        stadiumName: string
        opponentName: string
        isHome: boolean
    }
    seat?: {
        zone: string
        seatType: string
    } | null
    conditions: {
        when: string
        with: string
        seat: string
        food: string
    }
    weather?: {
        desc: string
        temp: number
        rainChance: number
        airGrade?: string | null
    } | null
    foodSpot?: {
        name: string
        category: string
        location?: string | null // 구장 내 맛집일 때: "3루 3층"
        walkMin?: number | null  // 구장 주변 맛집일 때: 도보 분
    } | null
}

// Gemini responseSchema는 OpenAPI 서브셋 · type은 대문자(STRING/ARRAY/OBJECT 등)여야 한다.
const REASONS_SCHEMA = {
    type: 'OBJECT',
    properties: {
        reasons: {type: 'ARRAY', items: {type: 'STRING'}},
    },
    required: ['reasons'],
} as const

function buildPrompt(body: PlanRecommendRequest): string {
    const {teamName, game, seat, conditions, weather, foodSpot} = body
    const facts = [
        `사용자는 "${teamName}" 팬이고, 직관 조건으로 언제 "${conditions.when}" · 누구랑 "${conditions.with}" · 좌석 "${conditions.seat}" · 선호 음식 "${conditions.food}"를 골랐다.`,
        `추천된 경기는 ${game.date} ${game.startTime} ${game.stadiumName}에서 열리는 ${teamName} vs ${game.opponentName} (${game.isHome ? '홈경기' : '원정경기'})다.`,
    ]
    if (seat) {
        facts.push(`배정된 좌석은 ${seat.zone}(${seat.seatType})다.`)
    }
    if (weather) {
        const airPart = weather.airGrade ? `, 대기질 ${weather.airGrade}` : ''
        facts.push(`경기 날 날씨는 ${weather.desc} ${weather.temp}도, 강수확률 ${weather.rainChance}%${airPart}다.`)
    }
    if (foodSpot) {
        const where = foodSpot.location
            ? `구장 내 ${foodSpot.location}에`
            : foodSpot.walkMin != null
                ? `구장에서 도보 ${foodSpot.walkMin}분 거리에`
                : '구장 근처에'
        facts.push(`맛집으로 "${foodSpot.name}"(${foodSpot.category})이 ${where} 있다.`)
    }

    return [
        '아래는 야구 직관 추천 서비스에서 이미 규칙 기반으로 계산해 둔 사실이다.',
        ...facts,
        '',
        '이 사실만 근거로, 사용자에게 이 경기를 추천하는 이유를 한국어 존댓말로 2~4문장 써줘.',
        '각 문장은 사용자가 고른 조건(언제/누구랑/좌석/음식) 중 하나, 또는 날씨·맛집 중 하나를 자연스럽게 언급해야 한다.',
        '위에 없는 사실(승률, 매진 여부, 선수 정보 등)은 절대 지어내지 마라.',
        '각 문장은 40자 이내로 간결하게, 느낌표 없이 써줘.',
    ].join('\n')
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {headers: corsHeaders})
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            return new Response(JSON.stringify({error: 'GEMINI_API_KEY가 설정되지 않았어요'}), {
                status: 500,
                headers: {...corsHeaders, 'Content-Type': 'application/json'},
            })
        }

        const body = (await req.json()) as PlanRecommendRequest

        // 20초 안에 안 끝나면 Supabase idle timeout(150초)까지 매달려 있지 않도록 직접 끊는다.
        const timeoutMs = 20000
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)

        let geminiRes: Response
        try {
            geminiRes = await fetch(GEMINI_URL(MODEL), {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'x-goog-api-key': apiKey},
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{parts: [{text: buildPrompt(body)}]}],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: REASONS_SCHEMA,
                        maxOutputTokens: 512,
                    },
                }),
            })
        } catch (fetchError) {
            if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
                throw new Error(`Gemini 응답이 ${timeoutMs / 1000}초 안에 오지 않았어요`)
            }
            throw fetchError
        } finally {
            clearTimeout(timer)
        }

        if (!geminiRes.ok) {
            const detail = await geminiRes.text()
            throw new Error(`Gemini API 오류 (${geminiRes.status}): ${detail}`)
        }

        const data = await geminiRes.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('AI 응답에서 텍스트를 찾지 못했어요')

        const {reasons} = JSON.parse(text) as {reasons: string[]}

        return new Response(JSON.stringify({reasons}), {
            headers: {...corsHeaders, 'Content-Type': 'application/json'},
        })
    } catch (error) {
        console.error('[plan-recommend]', error)
        const message = error instanceof Error ? error.message : '알 수 없는 오류'
        return new Response(JSON.stringify({error: message}), {
            status: 500,
            headers: {...corsHeaders, 'Content-Type': 'application/json'},
        })
    }
})
