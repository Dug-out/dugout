import {MATE_POST} from '../constants/policy.js'
import {supabase} from '../lib/supabase.js'
import {getMyTeam} from './profiles.js'
import {uploadErrorMessage} from './storage.js'

/** 저장 실패 → 화면에 보여줄 문구 */
function createErrorMessage(error) {
    if (error.code === '42501') return '이 경기로는 모집 글을 올릴 수 없어요. 경기를 다시 골라 주세요'
    if (error.code === '23514' || error.code === '23502') return '입력한 내용을 다시 확인해 주세요'
    if (error.code === '23503') return '선택한 경기를 찾을 수 없어요'
    return '모집 글을 올리지 못했어요. 잠시 후 다시 시도해 주세요'
}

// 모집 글 대표 이미지를 저장하는 버킷 (supabase/schema/04_storage.sql)
const MATE_IMAGE_BUCKET = 'mate-images'

/** 대표 이미지를 올리고 파일 경로와 공개 주소를 돌려준다 */
async function uploadMateImage(blob) {
    const {
        data: {session},
    } = await supabase.auth.getSession()
    const {id: userId} = session.user
    const path = `${userId}/${crypto.randomUUID()}.jpg`

    const {error} = await supabase.storage.from(MATE_IMAGE_BUCKET).upload(path, blob, {contentType: 'image/jpeg'})
    if (error) throw Object.assign(new Error(uploadErrorMessage(error)), {cause: error})

    const {
        data: {publicUrl},
    } = supabase.storage.from(MATE_IMAGE_BUCKET).getPublicUrl(path)
    return {path, url: publicUrl}
}

/** [모집 글 올리기] 모집 글 저장 · 방장과 내 응원팀은 알아서 채우고, image(Blob)가 있으면 함께 올린다 */
export async function createMatePost({
    gameId,
    title,
    seat,
    capacity,
    ages = [],
    gender = '무관',
    description = '',
    image = null,
}) {
    // 내 팀을 모르면 저장할 수 없다
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
        // 글이 저장되지 않았으니 올린 사진도 지운다
        if (uploaded)
            await supabase.storage
                .from(MATE_IMAGE_BUCKET)
                .remove([uploaded.path])
                .catch(() => {})
        throw Object.assign(new Error(createErrorMessage(error)), {cause: error})
    }
    const {id} = data
    return {id}
}

/** 모집 글 하나 · 글, 경기, 방장, 수락된 참여자, 내 신청 상태를 모아 가져온다 (없는 글이거나 다른 팀 글이면 null) */
export async function getMatePost(id) {
    const {
        data: {session},
    } = await supabase.auth.getSession()
    const {id: userId} = session.user

    // 글, 참여자, 내 신청 줄을 동시에 불러온다
    const [postResult, membersResult, myResult] = await Promise.all([
        supabase
            .from('mate_posts')
            .select(
                `id, title, image_url, status, seat, capacity, ages, gender, description, host_id, joined_count,
                host:profiles!host_id(nickname, avatar_url, manner_avg),
                game:games(game_at, home_team, away_team, stadium)`,
            )
            .eq('id', id)
            .maybeSingle(),
        supabase.rpc('mate_post_members', {p: id}),
        supabase.from('mate_members').select('role, status').eq('post_id', id).eq('user_id', userId).maybeSingle(),
    ])

    // 주소가 uuid 모양이 아니면(22P02) 없는 글과 같다
    if (postResult.error?.code === '22P02') return null
    if (postResult.error) throw postResult.error
    if (membersResult.error) throw membersResult.error
    if (myResult.error) throw myResult.error
    // 없는 글이거나 다른 팀 글
    if (!postResult.data) return null

    const {data: post} = postResult
    const {data: members} = membersResult
    const {data: mine} = myResult

    const {title, image_url: imageUrl, status, seat, capacity, ages, gender, description} = post
    const {joined_count: joinedCount, host_id: hostId, host, game} = post
    const {nickname, avatar_url: avatarUrl, manner_avg: manner} = host
    // 내가 방장이면 'host', 신청한 적이 없으면 null
    const myStatus = mine ? (mine.role === 'host' ? 'host' : mine.status) : null
    const {game_at: gameAt, home_team: home, away_team: away, stadium} = game
    return {
        id: post.id,
        myId: userId,
        title,
        imageUrl,
        isOpen: status === 'open',
        seat,
        capacity,
        ages,
        gender,
        description,
        joinedCount,
        host: {id: hostId, nickname, avatarUrl, manner: Number(manner)},
        game: {gameAt, home, away, stadium},
        members: members.map((row) => {
            const {user_id: memberId, role, nickname: memberName, avatar_url: memberAvatar} = row
            return {userId: memberId, role, nickname: memberName, avatarUrl: memberAvatar}
        }),
        myStatus,
        // 방장이거나 수락된 참여자인지 (채팅방에 들어갈 수 있는 사람)
        isMember: myStatus === 'host' || myStatus === 'accepted',
    }
}

/**
 * 메이트 찾기 목록 · 경기가 아직 시작 안 한 같은 팀 글 (무한 스크롤은 page 를 0, 1, 2… 로 올린다)
 * @param {{date?: Date | null, openOnly?: boolean, sort?: 'new' | 'old', page?: number}} [options]
 *  date: 고른 날(그날 경기의 글만, null 이면 전체) / sort: 'new' 최신순 · 'old' 오래된순(올린 시각 기준)
 * @returns {Promise<{posts: object[], hasMore: boolean}>} hasMore: 다음 쪽이 있는지
 */
export async function getMatePosts({date = null, openOnly = false, sort = 'new', page = 0} = {}) {
    const size = MATE_POST.PAGE_SIZE

    let query = supabase
        .from('mate_posts')
        .select(
            'id, title, image_url, status, seat, capacity, ages, gender, host_id, joined_count, host:profiles!host_id(nickname, avatar_url, manner_avg), game:games!inner(game_at, home_team, away_team, stadium)',
        )
        .gt('game.game_at', new Date().toISOString())
    if (openOnly) query = query.eq('status', 'open')
    if (date) {
        // 고른 날 0시부터 다음 날 0시까지
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        query = query.gte('game.game_at', start.toISOString()).lt('game.game_at', end.toISOString())
    }

    // 다음 쪽이 있는지 알려고 한 개 더 가져온다
    const {data, error} = await query
        .order('created_at', {ascending: sort === 'old'})
        .order('id')
        .range(page * size, page * size + size)
    if (error) throw error

    const posts = data.slice(0, size).map((row) => {
        const {id, title, image_url: imageUrl, status, seat, capacity, ages, gender} = row
        const {host_id: hostId, joined_count: joinedCount, host, game} = row
        const {nickname, avatar_url: avatarUrl, manner_avg: manner} = host
        const {game_at: gameAt, home_team: home, away_team: away, stadium} = game
        return {
            id,
            title,
            imageUrl,
            isOpen: status === 'open',
            seat,
            ages,
            gender,
            capacity,
            joinedCount,
            host: {id: hostId, nickname, avatarUrl, manner: Number(manner)},
            game: {gameAt, home, away, stadium},
        }
    })
    return {posts, hasMore: data.length > size}
}
