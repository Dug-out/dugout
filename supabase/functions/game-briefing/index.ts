// 승부 예측 AI 브리핑 (Supabase Edge Function) · 경기 하나의 한 줄 브리핑과 예상 스코어를 Claude 에게 받아 돌려준다
//  · 화면(예측하기)이 로그인한 사용자 토큰으로 부른다 · 받은 결과는 화면이 사용자 + 경기마다 브라우저에 저장해 고정한다
//  · 결과를 DB 에 저장하지 않는다 · games 는 읽기만 한다 (내 팀 경기만 보이는 건 DB 규칙)
//  · 필요한 비밀 값: ANTHROPIC_API_KEY (Claude API 키)
// 요청: { gameId: number } → 응답: { briefing: string, my: number, opp: number } (점수는 내 팀 : 상대)

// @ts-nocheck

import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const MODEL = 'claude-haiku-5-5' // 짧은 한 줄이라 가장 저렴하고 빠른 모델

// 화면(브라우저)에서 부르므로 다른 주소에서 오는 요청을 허락한다
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

// Claude 가 돌려줄 모양 · 이 모양으로만 답하게 강제한다
const SCHEMA = {
  type: 'object',
  properties: {
    briefing: { type: 'string', description: '경기 한 줄 브리핑 (해요체, 40자 안팎, 예상 스코어는 넣지 않음)' },
    my: { type: 'integer', description: '내 팀 예상 점수' },
    opp: { type: 'integer', description: '상대 팀 예상 점수' },
  },
  required: ['briefing', 'my', 'opp'],
  additionalProperties: false,
}

// 사용자마다 다른 브리핑이 나오도록 한 가지 관점을 골라 준다
const ANGLES = ['홈/원정 분위기', '올 시즌 상대 전적', '구장과 경기 시간', '팬 응원 열기', '설레는 승부 포인트']

const SYSTEM = `너는 KBO 야구 앱 "덕아웃"의 승부 예측 브리핑 작성자야.
- 주어진 경기 정보만 근거로 써. 주어지지 않은 기록(최근 몇 경기, 연승·연패, 선수 이름, 순위 등)은 절대 지어내지 마.
- briefing 은 한국어 해요체 한 문장, 40자 안팎. 예상 스코어나 승패 예측은 briefing 에 넣지 마.
- briefing 의 내용은 최근 10경기의 응원팀의 성적과 상대전적을 비교하고 예상 라인업에 근거해서 작성해.
- my, opp 는 야구에서 자연스러운 0~15 사이 정수로, 내 팀 : 상대 팀 순서야.`

// 한국 시간 '10월 22일 (목) 18:30'
const kstLabel = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value))

// 올해 시작 시각 (한국 시간 1월 1일 0시)
const seasonStart = () => `${new Date(Date.now() + 9 * 3600_000).getUTCFullYear()}-01-01T00:00:00+09:00`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // 로그인한 사용자만 · 그 사용자 권한으로 DB 를 읽는다 (내 팀 경기만 보인다)
    const authorization = req.headers.get('Authorization') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user } } = await supabase.auth.getUser(authorization.replace('Bearer ', ''))
    if (!user) return json({ error: 'unauthorized' }, 401)

    const { gameId } = await req.json()

    const { data: profile, error: profileError } = await supabase.from('profiles').select('team').eq('id', user.id).single()
    if (profileError) throw profileError
    const myTeam = profile.team

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, game_at, home_team, away_team, stadium')
      .eq('id', gameId)
      .maybeSingle()
    if (gameError) throw gameError
    if (!game) return json({ error: 'not_found' }, 404)

    const isHome = game.home_team === myTeam
    const opponent = isHome ? game.away_team : game.home_team

    // 올 시즌 상대 전적 (끝난 경기만)
    const { data: past, error: pastError } = await supabase
      .from('games')
      .select('home_team, home_score, away_score')
      .eq('status', 'finished')
      .gte('game_at', seasonStart())
      .or(`and(home_team.eq.${myTeam},away_team.eq.${opponent}),and(home_team.eq.${opponent},away_team.eq.${myTeam})`)
    if (pastError) throw pastError
    const record = { win: 0, draw: 0, lose: 0 }
    for (const row of past) {
      const [my, opp] = row.home_team === myTeam ? [row.home_score, row.away_score] : [row.away_score, row.home_score]
      if (my > opp) record.win += 1
      else if (my === opp) record.draw += 1
      else record.lose += 1
    }
    const recordLine = past.length === 0
      ? '올 시즌 첫 맞대결'
      : `${myTeam} ${record.win}승 ${record.draw}무 ${record.lose}패`

    const facts = `경기: ${kstLabel(game.game_at)} · ${game.stadium}
내 팀: ${myTeam} (${isHome ? '홈' : '원정'})
상대 팀: ${opponent}
올 시즌 상대 전적: ${recordLine}
이번 브리핑 관점: ${ANGLES[Math.floor(Math.random() * ANGLES.length)]}`

    // 🔌 Claude 호출 · 키는 비밀 값에서만 읽는다
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: facts }],
    })
    if (response.stop_reason !== 'end_turn') throw new Error(`stop_reason ${response.stop_reason}`)

    const text = response.content.find((block) => block.type === 'text')?.text ?? ''
    const result = JSON.parse(text)
    // 점수는 0~30 (승부 예측 규칙과 같다) 으로 맞추고, 브리핑은 한 줄로
    const clamp = (n: number) => Math.min(30, Math.max(0, Math.round(Number(n) || 0)))
    return json({ briefing: String(result.briefing).replace(/\s+/g, ' ').trim(), my: clamp(result.my), opp: clamp(result.opp) })
  } catch (err) {
    console.error(err)
    return json({ error: 'briefing_failed' }, 500)
  }
})
