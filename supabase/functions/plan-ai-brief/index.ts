// 직관 플랜 결과 화면의 "덕아웃 AI" 카드 · 경기 관련 최근 뉴스를 찾아 Gemini 로 짧은 소개 문구를 만든다
// 뉴스: NAVER API HUB 뉴스 검색 · 요약: Gemini
// 기사를 못 찾거나 Gemini 가 실패하면 빈 응답(204) · 플랜 화면은 ai 가 없으면 카드를 숨긴다 (makePlan 의 맛집·모임과 같은 원칙)

// @ts-nocheck

// games 테이블의 팀 코드 → 뉴스 검색·AI 프롬프트에 쓸 정식 구단명 (src/constants/policy.js TEAMS 와 같은 목록)
const TEAM_NAMES: Record<string, string> = {
  LG: 'LG 트윈스', 두산: '두산 베어스', KIA: 'KIA 타이거즈', 삼성: '삼성 라이온즈', 롯데: '롯데 자이언츠',
  한화: '한화 이글스', SSG: 'SSG 랜더스', NC: 'NC 다이노스', KT: 'KT 위즈', 키움: '키움 히어로즈',
}

type NewsItem = { title: string; description: string }

// 네이버 뉴스 검색 결과의 title·description 에는 <b> 강조 태그와 HTML 엔티티가 섞여 온다
function stripHtml(text: string) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

async function searchNews(query: string): Promise<NewsItem[]> {
  const url = `https://naverapihub.apigw.ntruss.com/search/v1/news?${new URLSearchParams({
    query,
    display: '8',
    sort: 'sim',
  })}`
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': Deno.env.get('NAVER_CLIENT_ID') ?? '',
      'X-NCP-APIGW-API-KEY': Deno.env.get('NAVER_CLIENT_SECRET') ?? '',
    },
  })
  if (!res.ok) throw new Error(`naver news ${res.status}`)
  const body = await res.json()
  return (body.items ?? []).map((item: {title: string; description: string}) => ({
    title: stripHtml(item.title),
    description: stripHtml(item.description),
  }))
}

async function summarize(homeName: string, awayName: string, articles: NewsItem[]) {
  const list = articles.map((article, i) => `${i + 1}. ${article.title} - ${article.description}`).join('\n')
  const prompt = `당신은 야구 직관을 준비하는 팬에게 오늘의 경기를 소개하는 '덕아웃 AI'입니다.
아래는 "${homeName} vs ${awayName}" 경기와 관련된 최근 뉴스 기사입니다.

${list}

이 기사들에서 실제로 다루는 구체적인 내용(순위 경쟁, 최근 연승·연패, 핵심 선수의 활약·부상, 라이벌 구도, 역대 전적, 포스트시즌 상황 등)을 찾아 소개 문구에 반영해 주세요.
기사에 없는 내용은 지어내지 말고, 밋밋하게 "응원 열기가 뜨거워요" 같은 뻔한 말 대신 기사 속 구체적인 소재를 직접 언급해 주세요.
- highlight: 이 경기를 보러 가고 싶게 만드는 한 문장. 기사 속 구체적 소재(선수 이름, 순위, 연승 기록 등)를 하나 이상 담는다. 느낌표로 끝나도 좋음, 20자 내외
- point: highlight 를 이어서 설명하는 한두 문장. 기사의 구체적 근거를 덧붙인다, 40~60자
- tags: 이 경기를 표현하는 키워드 3개 (# 기호는 빼고). 너무 일반적인 단어 대신 기사에서 실제로 다루는 소재로 고른다

반드시 아래 JSON 형식으로만, 다른 설명 없이 답하세요:
{"highlight": "...", "point": "...", "tags": ["...", "...", "..."]}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{parts: [{text: prompt}]}],
        generationConfig: {responseMimeType: 'application/json'},
      }),
    },
  )
  if (!res.ok) throw new Error(`gemini ${res.status}`)
  const body = await res.json()
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('gemini: no text')

  const parsed = JSON.parse(text)
  if (!parsed.highlight || !parsed.point || !Array.isArray(parsed.tags)) throw new Error('gemini: bad shape')
  return parsed
}

// 브라우저(supabase-js functions.invoke)가 직접 부르는 함수라 프리플라이트(OPTIONS)·CORS 헤더가 필요하다
// (sync-games·send-push 는 cron·DB 트리거가 불러서 이 처리가 없었다)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, {headers: CORS_HEADERS})

  try {
    const {homeTeam, awayTeam} = await req.json()
    const homeName = TEAM_NAMES[homeTeam]
    const awayName = TEAM_NAMES[awayTeam]
    if (!homeName || !awayName) return Response.json({error: 'unknown team'}, {status: 400, headers: CORS_HEADERS})

    const articles = await searchNews(`${homeName} ${awayName}`)
    if (articles.length === 0) return new Response(null, {status: 204, headers: CORS_HEADERS})

    const {highlight, point, tags} = await summarize(homeName, awayName, articles)
    return Response.json(
      {highlight, point, tags: tags.slice(0, 3), sourceCount: articles.length},
      {headers: CORS_HEADERS},
    )
  } catch (err) {
    return Response.json(
      {error: String(err instanceof Error ? err.message : err)},
      {status: 500, headers: CORS_HEADERS},
    )
  }
})
