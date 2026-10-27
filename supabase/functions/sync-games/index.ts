// KBO 경기 가져오기 (Supabase Edge Function) · API-Sports 에서 받아 games 에 넣거나 고친다
//  · mode "full": 올해 전체 경기 (일정이 바뀌었거나 새 경기가 생겼는지 맞춘다) · 호출 1건
//  · mode "recent": 어제·오늘·내일 경기 (끝난 경기의 점수를 채우고, 내일로 옮겨진 경기를 알아챈다) · 호출 3건 (기본)
// 같은 경기는 api_game_id 로 알아보고 고친다 · api_game_id 가 없는 경기(직접 넣은 것)는 건드리지 않는다
// 경기가 끝난 것(finished)으로 바뀌면 승부 예측 채점은 DB 트리거가 한다 (09_predictions.sql)

// @ts-nocheck

import { createClient } from 'npm:@supabase/supabase-js@2'

const LEAGUE = 5 // API-Sports 의 KBO 리그 번호

// API-Sports 팀 번호 → games 의 팀 코드 · 여기 없는 팀(올스타 팀 등)의 경기는 넣지 않는다
const TEAMS: Record<number, string> = {
  93: 'LG', 88: '두산', 90: 'KIA', 97: '삼성', 94: '롯데',
  89: '한화', 647: 'SSG', 95: 'NC', 91: 'KT', 92: '키움',
}

// 홈팀 기준 구장 · API 에 구장 정보가 없어서 홈팀으로 정한다 (홈팀 구장이 아닌 경기는 틀릴 수 있다)
const STADIUMS: Record<string, string> = {
  LG: '잠실야구장', 두산: '잠실야구장', KIA: '챔피언스필드', 삼성: '라이온즈파크', 롯데: '사직야구장',
  한화: '한화생명 볼파크', SSG: 'SSG랜더스필드', NC: 'NC파크', KT: 'KT위즈파크', 키움: '고척스카이돔',
}

// 시즌별 정규시즌 시작일 · 이 날짜 앞의 시범경기는 넣지 않는다
const REGULAR_START: Record<number, string> = { 2026: '2026-03-28' }

type ApiGame = {
  id: number
  date: string
  status: { short: string }
  teams: { home: { id: number }; away: { id: number } }
  scores: { home: { total: number | null }; away: { total: number | null } }
}

// 한국 시간 기준 날짜 (YYYY-MM-DD) · offsetDays 만큼 이동
const kstDate = (offsetDays = 0) =>
  new Date(Date.now() + 9 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10)

async function fetchGames(params: Record<string, string | number>): Promise<ApiGame[]> {
  const query = new URLSearchParams({ league: String(LEAGUE), timezone: 'Asia/Seoul', ...(params as Record<string, string>) })
  const res = await fetch(`https://v1.baseball.api-sports.io/games?${query}`, {
    headers: { 'x-apisports-key': Deno.env.get('API_SPORTS_KEY') ?? '' },
  })
  if (!res.ok) throw new Error(`API-Sports ${res.status}`)
  const body = await res.json()
  // 오류(요금제, 한도 등)는 errors 에 담겨 온다
  if (Array.isArray(body.errors) ? body.errors.length > 0 : Object.keys(body.errors ?? {}).length > 0) {
    throw new Error(`API-Sports: ${JSON.stringify(body.errors)}`)
  }
  return body.response
}

// API 경기 하나 → games 한 줄 · 넣지 않을 경기는 null
function toRow(game: ApiGame, season: number) {
  const home = TEAMS[game.teams.home.id]
  const away = TEAMS[game.teams.away.id]
  if (!home || !away) return null
  if (game.date.slice(0, 10) < (REGULAR_START[season] ?? '')) return null

  const { total: homeScore } = game.scores.home
  const { total: awayScore } = game.scores.away
  const hasScore = homeScore !== null && awayScore !== null

  // FT 종료 / POST 순연·CANC 취소 / ABD 중단은 점수가 있으면 끝난 것으로 본다 / 나머지(NS 시작 전, 진행 중)는 예정
  let status: 'scheduled' | 'finished' | 'canceled'
  switch (game.status.short) {
    case 'FT':
    case 'AOT':
      // 끝났다는데 점수가 없으면 열리지 않은 경기로 본다 (우천 취소 등이 이렇게 오는 경우가 있다)
      status = hasScore ? 'finished' : 'canceled'
      break
    case 'ABD':
      status = hasScore ? 'finished' : 'canceled'
      break
    case 'POST':
    case 'CANC':
      status = 'canceled'
      break
    default:
      status = 'scheduled'
  }

  return {
    api_game_id: game.id,
    home_team: home,
    away_team: away,
    stadium: STADIUMS[home],
    game_at: game.date,
    status,
    // 끝난 경기만 점수를 넣는다 (finished 는 점수가 꼭 있어야 한다)
    home_score: status === 'finished' ? homeScore : null,
    away_score: status === 'finished' ? awayScore : null,
  }
}

Deno.serve(async (req) => {
  // cron 이 보내는 비밀 문구가 맞아야 한다 (이 함수는 로그인 확인을 끄고 이 문구로 막는다)
  const secret = Deno.env.get('SYNC_SECRET')
  if (!secret || req.headers.get('x-sync-secret') !== secret) {
    return new Response('unauthorized', { status: 401 })
  }

  try {
    const { mode = 'recent' } = await req.json().catch(() => ({}))
    const season = Number(kstDate().slice(0, 4))

    const games =
      mode === 'full'
        ? await fetchGames({ season })
        : (await Promise.all([kstDate(-1), kstDate(), kstDate(1)].map((date) => fetchGames({ season, date })))).flat()

    const rows = games.map((game) => toRow(game, season)).filter((row) => row !== null)

    // 서비스 키는 이 함수 안에서만 쓰고 Supabase 가 자동으로 넣어 준다
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from('games').upsert(rows.slice(i, i + 500), { onConflict: 'api_game_id' })
      if (error) throw new Error(error.message)
    }

    // 전체를 받았을 때, 이제 API 목록에 없는 예정 경기는 취소로 돌린다 (날짜가 옮겨지며 번호가 바뀐 경기가 유령으로 남지 않게)
    // 응답이 비정상으로 적게 오면 전부 취소해 버리지 않도록 건너뛴다
    let canceled = 0
    if (mode === 'full' && rows.length >= 100) {
      const ids = rows.map((row) => row.api_game_id)
      const { data, error } = await supabase
        .from('games')
        .update({ status: 'canceled' })
        .eq('status', 'scheduled')
        .not('api_game_id', 'is', null)
        .not('api_game_id', 'in', `(${ids.join(',')})`)
        .select('id')
      if (error) throw new Error(error.message)
      canceled = data.length
    }

    return Response.json({ mode, season, received: games.length, saved: rows.length, canceled })
  } catch (err) {
    return Response.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 })
  }
})
