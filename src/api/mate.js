import {supabase} from '../lib/supabase.js'
import {uploadErrorMessage} from './storage.js'

/** 브라우저에 저장된 로그인 정보에서 id를 읽고, 해당 사용자의 team을 조회 */
export async function getMyTeam() {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user

    const {data, error} = await supabase
        .from('profiles')
        .select('team')
        .eq('id', userId)
        .single()
    if (error) throw error
    const {team} = data
    return team
}

/** [경기 선택] 목록 · 시작 전 예정 경기를 빠른 순으로 (내 팀 경기만 오는 건 DB 규칙) */
export async function getSelectableGames() {
    const {data, error} = await supabase
        .from('games')
        .select('id, game_at, home_team, away_team, stadium')
        .eq('status', 'scheduled')
        .gt('game_at', new Date().toISOString())
        .order('game_at')
    if (error) throw error
    return data.map((row) => {
        const {id, game_at: gameAt, home_team: home, away_team: away, stadium} = row
        return {id, gameAt, home, away, stadium}
    })
}

/** 저장 실패 → 화면에 보여줄 문구 */
function createErrorMessage(error) {
    if (error.code === '42501') return '이 경기로는 모집 글을 올릴 수 없어요. 경기를 다시 골라 주세요'
    if (error.code === '23514' || error.code === '23502') return '입력한 내용을 다시 확인해 주세요'
    if (error.code === '23503') return '선택한 경기를 찾을 수 없어요'
    return '모집 글을 올리지 못했어요. 잠시 후 다시 시도해 주세요'
}

// 모집 글 대표 이미지를 저장하는 버킷 (supabase/schema/04_storage.sql)
const MATE_IMAGE_BUCKET = 'mate-images'

/** 대표 이미지를 올린다 · {내 id}/{무작위 이름}.jpg 에 저장하고 파일 경로와 공개 주소를 돌려준다 */
async function uploadMateImage(blob) {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user
    const path = `${userId}/${crypto.randomUUID()}.jpg`

    const {error} = await supabase.storage
        .from(MATE_IMAGE_BUCKET)
        .upload(path, blob, {contentType: 'image/jpeg'})
    if (error) throw Object.assign(new Error(uploadErrorMessage(error)), {cause: error})

    const {data: {publicUrl}} = supabase.storage.from(MATE_IMAGE_BUCKET).getPublicUrl(path)
    return {path, url: publicUrl}
}

/**
 * [모집 글 올리기] 모집 글 저장 · 방장과 내 응원팀은 알아서 채운다
 * image: 대표 이미지(Blob) · 없으면 기본 이미지로 보인다. 글 저장에 실패하면 올려 둔 사진은 지운다.
 * @returns {Promise<{id: string}>} 새 글의 id
 */
export async function createMatePost({
                                         gameId,
                                         title,
                                         seat,
                                         capacity,
                                         ages = [],
                                         gender = '무관',
                                         description = '',
                                         image = null
                                     }) {
    // 내 팀을 못 불러오면 저장도 못 하므로, 다른 저장 실패와 같은 한국어 문구의 Error 로 던진다
    const team = await getMyTeam().catch((cause) => {
        throw Object.assign(new Error(createErrorMessage({})), {cause})
    })

    const uploaded = image ? await uploadMateImage(image) : null

    const {data, error} = await supabase
        .from('mate_posts')
        .insert({
            team,
            game_id: gameId,
            title: title.trim(),
            seat,
            capacity,
            ages,
            gender,
            description: description.trim(),
            image_url: uploaded?.url ?? null,
        })
        .select('id')
        .single()
    if (error) {
        // 글이 저장되지 않았으니 올려 둔 사진도 지운다 (지우지 못해도 글쓰기 오류가 우선이다)
        if (uploaded) await supabase.storage.from(MATE_IMAGE_BUCKET).remove([uploaded.path]).catch(() => {
        })
        throw Object.assign(new Error(createErrorMessage(error)), {cause: error})
    }
    const {id} = data
    return {id}
}
