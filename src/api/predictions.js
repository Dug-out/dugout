import {supabase} from '../lib/supabase.js'
import {getMyTeam} from './profiles.js'

// 화면은 모두 "내 응원팀 기준"(내 팀 점수 : 상대 점수)으로 다룬다 · DB 는 홈/원정 기준이라 여기서 바꾼다
const mine = (homeTeam, myTeam, home, away) => (homeTeam === myTeam ? [home, away] : [away, home])

/** 이번 시즌(올해) 시작 시각 */
const seasonStart = () => new Date(new Date().getFullYear(), 0, 1).toISOString()

/**
 * 예측하기 화면 · 내 팀의 다음 경기와 내가 이미 남긴 예측, 올 시즌 상대 전적
 * @returns {Promise<null | {game: {id: number, gameAt: string, stadium: string, myTeam: string, opponent: string, isHome: boolean}, myPick: null | {my: number, opp: number}, record: {win: number, draw: number, lose: number}}>} 예측할 경기가 없으면 null
 */
export async function getPredictionGame() {
    const myTeam = await getMyTeam()

    // 예정 경기 중 가장 빠른 것 (내 팀 경기만 오는 건 DB 규칙)
    const {data: next, error} = await supabase
        .from('games')
        .select('id, game_at, home_team, away_team, stadium')
        .eq('status', 'scheduled')
        .gt('game_at', new Date().toISOString())
        .order('game_at')
        .limit(1)
        .maybeSingle()
    if (error) throw error
    if (!next) return null

    const {id, game_at: gameAt, home_team: home, away_team: away, stadium} = next
    const opponent = home === myTeam ? away : home

    const [pickResult, recordResult] = await Promise.all([
        supabase.from('predictions').select('home_score, away_score').eq('game_id', id).maybeSingle(),
        supabase
            .from('games')
            .select('home_team, home_score, away_score')
            .eq('status', 'finished')
            .gte('game_at', seasonStart())
            .or(
                `and(home_team.eq.${myTeam},away_team.eq.${opponent}),and(home_team.eq.${opponent},away_team.eq.${myTeam})`,
            ),
    ])
    if (pickResult.error) throw pickResult.error
    if (recordResult.error) throw recordResult.error

    const pick = pickResult.data
    const myPick = pick ? mine(home, myTeam, pick.home_score, pick.away_score) : null

    const record = {win: 0, draw: 0, lose: 0}
    for (const row of recordResult.data) {
        const {home_team: homeTeam, home_score: homeScore, away_score: awayScore} = row
        const [my, opp] = mine(homeTeam, myTeam, homeScore, awayScore)
        if (my > opp) record.win += 1
        else if (my === opp) record.draw += 1
        else record.lose += 1
    }

    return {
        game: {id, gameAt, stadium, myTeam, opponent, isHome: home === myTeam},
        myPick: myPick && {my: myPick[0], opp: myPick[1]},
        record,
    }
}

/** 저장 실패 → 화면에 보여줄 문구 */
function saveErrorMessage({code}) {
    if (code === '42501') return '이미 마감됐거나 예측할 수 없는 경기예요'
    if (code === '23514') return '스코어를 다시 확인해 주세요'
    return '예측을 저장하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/**
 * 예측 저장 · 이미 있으면 고치고 없으면 새로 남긴다 (경기 시작 전까지만, 마감은 DB 규칙)
 * @param {{gameId: number, isHome: boolean, my: number, opp: number}} pick isHome: 내 팀이 홈인지
 */
export async function savePrediction({gameId, isHome, my, opp}) {
    const scores = {home_score: isHome ? my : opp, away_score: isHome ? opp : my}

    const {data: updated, error: updateError} = await supabase
        .from('predictions')
        .update(scores)
        .eq('game_id', gameId)
        .select('id')
    if (updateError) throw Object.assign(new Error(saveErrorMessage(updateError)), {cause: updateError})
    if (updated.length > 0) return

    const {error} = await supabase.from('predictions').insert({game_id: gameId, ...scores})
    if (error) throw Object.assign(new Error(saveErrorMessage(error)), {cause: error})
}

/**
 * 팬 예측 비율 · 내 응원팀 팬들의 승·무·패 수와 가장 많이 예측한 스코어 (DB 함수 game_prediction_stats)
 * @returns {Promise<{total: number, win: number, draw: number, lose: number, top: null | {my: number, opp: number, count: number}}>}
 */
export async function getGameStats(gameId) {
    const {data, error} = await supabase.rpc('game_prediction_stats', {p_game: gameId}).single()
    if (error) throw error

    const {total, win, draw, lose, top_my: topMy, top_opp: topOpp, top_count: topCount} = data
    return {total, win, draw, lose, top: topCount > 0 ? {my: topMy, opp: topOpp, count: topCount} : null}
}

/**
 * 랭킹 · 같은 응원팀의 1~10위와 내 줄 (DB 함수 prediction_ranking)
 * @param {'month' | 'season'} period
 * @returns {Promise<{rank: number, userId: string, nickname: string, avatarUrl: string | null, points: number, isMe: boolean}[]>}
 */
export async function getRanking(period) {
    const {data, error} = await supabase.rpc('prediction_ranking', {p_period: period})
    if (error) throw error

    return data.map((row) => {
        const {rank, user_id: userId, nickname, avatar_url: avatarUrl, points, is_me: isMe} = row
        return {rank, userId, nickname, avatarUrl, points, isMe}
    })
}

/**
 * 내 누적 점수와 순위 · 점수가 없으면 rank 는 null (DB 함수 my_prediction_summary)
 * @returns {Promise<{month: {points: number, rank: number | null}, season: {points: number, rank: number | null}}>}
 */
export async function getPredictionSummary() {
    const {data, error} = await supabase.rpc('my_prediction_summary')
    if (error) throw error

    const find = (period) => {
        const {points, rank} = data.find((row) => row.period === period)
        return {points, rank}
    }
    return {month: find('month'), season: find('season')}
}

/** 한 줄의 결과 상태 · wait 경기 전 / miss 빗나감 / hit 승부 적중 / exact 스코어 적중 */
function pickState(points, same) {
    if (points === null) return 'wait'
    if (points === 0) return 'miss'
    return same ? 'exact' : 'hit'
}

/** 예측 한 줄을 내 팀 기준으로 바꾼다 */
function toPick(row, myTeam) {
    const {id, home_score: homeScore, away_score: awayScore, points, game} = row
    const {game_at: gameAt, home_team: home, away_team: away, status, home_score: realHome, away_score: realAway} = game
    const [my, opp] = mine(home, myTeam, homeScore, awayScore)
    const finished = status === 'finished'
    const [realMy, realOpp] = finished ? mine(home, myTeam, realHome, realAway) : [null, null]
    return {
        id,
        gameId: row.game_id,
        gameAt,
        opponent: home === myTeam ? away : home,
        pick: {my, opp},
        result: finished ? {my: realMy, opp: realOpp} : null,
        points,
        state: pickState(points, finished && my === realMy && opp === realOpp),
    }
}

const PICK_SELECT =
    'id, game_id, home_score, away_score, points, game:games(game_at, home_team, away_team, status, home_score, away_score)'

/**
 * 내 예측 내역 · 경기가 최근인 것부터
 * @returns {Promise<{id: number, gameId: number, gameAt: string, opponent: string, pick: {my: number, opp: number}, result: null | {my: number, opp: number}, points: number | null, state: 'wait' | 'miss' | 'hit' | 'exact'}[]>}
 */
export async function getMyPredictions() {
    const myTeam = await getMyTeam()
    const {data, error} = await supabase.from('predictions').select(PICK_SELECT).order('game_id', {ascending: false})
    if (error) throw error

    return data.map((row) => toPick(row, myTeam)).sort((a, b) => b.gameAt.localeCompare(a.gameAt))
}

/** 예측 결과 화면 · 한 경기에 대한 내 예측 (getMyPredictions 와 같은 모양) · 예측하지 않았으면 null */
export async function getPredictionResult(gameId) {
    const myTeam = await getMyTeam()
    const {data, error} = await supabase.from('predictions').select(PICK_SELECT).eq('game_id', gameId).maybeSingle()
    if (error) throw error

    return data && toPick(data, myTeam)
}
