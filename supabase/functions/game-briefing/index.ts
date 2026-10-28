// 승부 예측 AI 브리핑 (Supabase Edge Function) · 경기 하나의 한 줄 브리핑과 예상 스코어를 Claude 에게 받아 돌려준다
//  · 화면(예측하기)이 로그인한 사용자 토큰으로 부른다 · 받은 결과는 화면이 사용자 + 경기마다 브라우저에 저장해 고정한다
//  · 결과를 DB 에 저장하지 않는다 · games 는 읽기만 한다 (내 팀 경기만 보이는 건 DB 규칙)
//  · Claude 에게는 내 팀의 올 시즌 끝난 경기에서 계산한 기록(시즌 · 최근 10경기 · 연승연패 · 상대 전적 · 구장 · 홈원정 · 시리즈 · 지난 맞대결)만 준다
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
    briefing: { type: 'string', description: '경기 한 줄 브리핑 (편한 반말, 40자 안팎, 예상 스코어는 넣지 않음)' },
    my: { type: 'integer', description: '내 팀 예상 점수' },
    opp: { type: 'integer', description: '상대 팀 예상 점수' },
  },
  required: ['briefing', 'my', 'opp'],
  additionalProperties: false,
}

// 사용자마다 다른 브리핑이 나오도록 한 가지 관점을 골라 준다
const ANGLES = ['홈/원정 분위기', '올 시즌 상대 전적', '구장과 경기 시간', '팬 응원 열기', '설레는 승부 포인트']

const SYSTEM = `너는 KBO 야구 앱 "덕아웃"의 승부 예측 브리핑 작성자야.


사용자 메시지로 받은 경기 정보만 근거로 써. 이 정보는 앱 DB의 실제 경기 결과에서 계산한 값이야.
받을 수 있는 정보: 응원팀의 올해 시즌 전체 기록, 최근 10경기 성적, 연승·연패, 최근 10경기 평균 득점·실점, 올시즌 상대팀과의 전적, 이 구장 성적, 홈·원정 성적, 시리즈 전적, 지난 맞대결 점수, 관점.
선발 투수, 라인업, 선수 이름, 부상, 순위처럼 주어지지 않은 정보는 절대 쓰지 마.
briefing 은 야구 좋아하는 친구가 옆에서 말해주듯 편한 반말로 한 문장, 40자 안팎.
기록 숫자를 앞에 내세우지 말고, 기록에서 느껴지는 분위기와 흐름을 자연스럽게 말해.
briefing 에 예상 스코어나 승패 예측은 넣지 마.
briefing 에 득점·실점 숫자, 평균 점수, 경기 점수 같은 점수 분석은 넣지 마. 평균 득점·실점은 my, opp 를 정할 때만 써.
briefing 은 승패 기록(시즌 성적, 최근 10경기, 상대 전적, 시리즈 전적, 연승·연패, 홈·원정, 구장 성적)과 흐름 위주로 써.
briefing 은 내 팀에 유리하거나 불리한 기록을 가리지 말고, 두 팀 차이를 객관적으로 담아서 써.
정보가 부족하면 관점(angle)으로만 써.
my, opp 는 0~20 사이 정수, 내 팀 : 상대 팀 순서야.
my, opp 는 최근 10경기 평균 득점·실점을 기준으로 정하고, 상대 전적과 연승·연패 흐름을 반영해 조정해.
my, opp 는 기록대로 정해. 내 팀이 질 것 같으면 지는 점수, 비슷하면 같은 점수로 해도 돼.
포스트시즌 경기라면 my 와 opp 를 같은 점수로 하지 마. 반드시 승패가 나는 점수로 해.`

// 한국 시간 '10월 22일 (목) 18:30'
const kstLabel = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value))

// 올해 시작 시각 (한국 시간 1월 1일 0시)
const seasonStart = () => `${new Date(Date.now() + 9 * 3600_000).getUTCFullYear()}-01-01T00:00:00+09:00`

// 포스트시즌 시작일 (한국 시간) · 프런트 constants/planner.js 의 POSTSEASON_START 와 같은 값을 시즌마다 추가한다
const POSTSEASON_START: Record<number, string> = { 2026: '2026-10-14' }

const isPostseason = (value: string) => {
  const date = new Date(new Date(value).getTime() + 9 * 3600_000).toISOString().slice(0, 10)
  const start = POSTSEASON_START[Number(date.slice(0, 4))]
  return Boolean(start) && date >= start
}

// 한국 시간 '10.14'
const kstMonthDay = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' })
    .format(new Date(value)).replace(/\.\s*/g, '.').replace(/\.$/, '')

// 내 팀 기준으로 바꾼 경기 하나 (끝난 경기, 점수가 있는 것만)
type Result = { at: string; opponent: string; stadium: string; isHome: boolean; my: number; opp: number }
const resultOf = (r: Result) => (r.my > r.opp ? 'win' : r.my < r.opp ? 'lose' : 'draw')

// '12승 1무 9패' · 경기가 없으면 '기록 없음'
const recordOf = (rows: Result[]) => {
  if (rows.length === 0) return '기록 없음'
  const count = { win: 0, draw: 0, lose: 0 }
  for (const row of rows) count[resultOf(row)] += 1
  return `${count.win}승 ${count.draw}무 ${count.lose}패`
}

// '2연승 중' · '3연패 중' · 무승부나 첫 결과가 다르면 '연승·연패 없음' (rows 는 최근 경기가 앞)
const streakOf = (rows: Result[]) => {
  const first = rows[0] && resultOf(rows[0])
  if (!first || first === 'draw') return '연승·연패 없음'
  const length = rows.findIndex((row) => resultOf(row) !== first)
  const count = length === -1 ? rows.length : length
  return count < 2 ? '연승·연패 없음' : `${count}${first === 'win' ? '연승' : '연패'} 중`
}

// 평균 득점·실점 (소수 첫째 자리)
const averageOf = (rows: Result[]) => {
  const avg = (pick: (r: Result) => number) => (rows.reduce((sum, row) => sum + pick(row), 0) / rows.length).toFixed(1)
  return `평균 득점 ${avg((r) => r.my)} · 평균 실점 ${avg((r) => r.opp)}`
}

// 승패 한 글자
const mark = (row: Result) => ({ win: '승', lose: '패', draw: '무' })[resultOf(row)]

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

    // 내 팀의 올 시즌 끝난 경기 · 이 경기보다 앞선 것만 (내 팀 경기만 보이는 건 DB 규칙) · 최근 경기가 앞
    const { data: rows, error: pastError } = await supabase
      .from('games')
      .select('game_at, home_team, away_team, home_score, away_score, stadium')
      .eq('status', 'finished')
      .gte('game_at', seasonStart())
      .lt('game_at', game.game_at)
      .or(`home_team.eq.${myTeam},away_team.eq.${myTeam}`)
      .order('game_at', { ascending: false })
    if (pastError) throw pastError

    const played: Result[] = rows
      .filter((row) => row.home_score !== null && row.away_score !== null)
      .map((row) => {
        const home = row.home_team === myTeam
        return {
          at: row.game_at,
          opponent: home ? row.away_team : row.home_team,
          stadium: row.stadium,
          isHome: home,
          my: home ? row.home_score : row.away_score,
          opp: home ? row.away_score : row.home_score,
        }
      })

    const recent = played.slice(0, 10)
    const versus = played.filter((row) => row.opponent === opponent)
    const atStadium = played.filter((row) => row.stadium === game.stadium)

    // 시리즈 전적: 바로 앞 경기들이 같은 상대이고 이 경기와 4일 안인 것 (프로야구 시리즈는 보통 2~3경기)
    const gameTime = new Date(game.game_at).getTime()
    const series: Result[] = []
    for (const row of played) {
      if (row.opponent !== opponent || gameTime - new Date(row.at).getTime() > 4 * 86400_000) break
      series.push(row)
    }

    const last = versus[0]
    const lines = [
      `경기: ${kstLabel(game.game_at)} · ${game.stadium}`,
      `내 팀: ${myTeam} (${isHome ? '홈' : '원정'})`,
      `상대 팀: ${opponent}`,
      `포스트시즌 경기: ${isPostseason(game.game_at) ? '예' : '아니오'}`,
      played.length === 0
        ? '올해 시즌 전체 기록: 아직 끝난 경기가 없음'
        : `올해 시즌 전체 기록: ${recordOf(played)} (${played.length}경기)`,
      recent.length === 0
        ? '최근 10경기: 기록 없음'
        : `최근 ${recent.length}경기: ${recordOf(recent)} · ${recent.map(mark).join('')} (최근 경기부터) · ${averageOf(recent)}`,
      `연승·연패: ${streakOf(played)}`,
      `올 시즌 ${opponent}전: ${versus.length === 0 ? '첫 맞대결' : recordOf(versus)}`,
      `이 구장(${game.stadium}) 성적: ${recordOf(atStadium)}`,
      `홈 성적: ${recordOf(played.filter((row) => row.isHome))} · 원정 성적: ${recordOf(played.filter((row) => !row.isHome))}`,
      `시리즈 전적: ${series.length === 0 ? '이번 시리즈 첫 경기' : `${recordOf(series)} (${series.length}경기 치름)`}`,
      `지난 맞대결: ${
        last
          ? `${kstMonthDay(last.at)} ${myTeam} ${last.my} : ${last.opp} ${opponent} (${mark(last)})`
          : '없음'
      }`,
      `관점: ${ANGLES[Math.floor(Math.random() * ANGLES.length)]}`,
    ]
    const facts = lines.join('\n')

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
    let my = clamp(result.my)
    let opp = clamp(result.opp)
    // 포스트시즌은 무승부가 없다 · 프롬프트로 막아도 같은 점수가 오면 올 시즌 상대 전적이 앞선 쪽(동률이면 내 팀)에 1점을 더한다
    if (isPostseason(game.game_at) && my === opp) {
      const wins = versus.filter((row) => resultOf(row) === 'win').length
      const loses = versus.filter((row) => resultOf(row) === 'lose').length
      if (wins >= loses) my += 1
      else opp += 1
    }
    return json({ briefing: String(result.briefing).replace(/\s+/g, ' ').trim(), my, opp })
  } catch (err) {
    console.error(err)
    return json({ error: 'briefing_failed' }, 500)
  }
})
