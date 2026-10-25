import {supabase} from '../lib/supabase.js'

/** 신청 실패 → 화면에 보여줄 문구 */
function applyErrorMessage({code}) {
    if (code === '23505') return '이미 신청한 모집 글이에요'
    if (code === '42501') return '지금은 신청할 수 없어요. 모집이 마감됐거나 경기가 이미 시작됐을 수 있어요'
    if (code === '23514') return '입력한 내용을 다시 확인해 주세요'
    return '신청하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/** 참여 신청 · 한마디와 함께 대기 상태로 신청한다 (수락은 방장이 한다) */
export async function applyToMatePost({postId, message = ''}) {
    const {error} = await supabase.from('mate_members').insert({post_id: postId, message: message.trim()})
    if (error) throw Object.assign(new Error(applyErrorMessage(error)), {cause: error})
}

/**
 * 내 직관 약속 · 내가 방장이거나 수락된 참여자인 모집 글을 가져온다 (수락 대기·거절·나간 글은 뺀다)
 * pendingCount 는 대기 중인 신청 수 · 방장만 볼 수 있어서 방장이 아니면 0
 */
export async function getMyPosts() {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user

    const {data, error} = await supabase
        .from('mate_members')
        .select(`
            role,
            post:mate_posts!inner(
                id, title, image_url, capacity, joined_count,
                host:profiles!host_id(nickname),
                game:games!inner(game_at, home_team, away_team, stadium),
                members:mate_members(status)
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted')
    if (error) throw error

    return data.map((row) => {
        const {role, post} = row
        const {id, title, image_url: image, capacity, joined_count: joinedCount} = post
        const {host, game, members} = post
        return {
            id,
            title,
            image,
            role,
            capacity,
            joinedCount,
            hostNickname: host.nickname,
            pendingCount: role === 'host' ? members.filter((m) => m.status === 'pending').length : 0,
            game: {gameAt: game.game_at, home: game.home_team, away: game.away_team, stadium: game.stadium},
        }
    })
}

/**
 * 신청자 관리 · 방장이 자기 글의 대기 중 신청과 수락된 참여자를 한 번에 가져온다.
 * 없는 글이거나 내가 방장이 아니면 null 을 돌려준다.
 */
export async function getMateApplicants(postId) {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user

    const [postResult, membersResult] = await Promise.all([
        supabase
            .from('mate_posts')
            .select('id, title, capacity, host_id, joined_count, game:games(game_at, home_team, away_team, stadium)')
            .eq('id', postId)
            .maybeSingle(),
        supabase
            .from('mate_members')
            .select('user_id, role, status, message, created_at, user:profiles!user_id(nickname, avatar_url, age_group, team)')
            .eq('post_id', postId)
            .in('status', ['pending', 'accepted'])
            .order('created_at'),
    ])

    // 주소가 uuid 모양이 아니면(22P02) 없는 글과 같다
    if (postResult.error?.code === '22P02') return null
    if (postResult.error) throw postResult.error
    if (membersResult.error) throw membersResult.error
    // 없는 글, 다른 팀 글, 내가 방장이 아닌 글
    if (!postResult.data || postResult.data.host_id !== userId) return null

    const {data: post} = postResult
    const {data: rows} = membersResult
    const {game} = post

    const applicants = rows.map((row) => {
        const {user_id: id, role, status, message, user} = row
        return {
            userId: id,
            role,
            status,
            message,
            nickname: user.nickname,
            avatarUrl: user.avatar_url,
            age: user.age_group,
            team: user.team,
        }
    })

    return {
        post: {
            id: post.id,
            title: post.title,
            capacity: post.capacity,
            joinedCount: post.joined_count,
            game: {gameAt: game.game_at, home: game.home_team, away: game.away_team, stadium: game.stadium},
        },
        // 대기 중인 신청 / 수락된 참여자 (방장 본인은 뺀다)
        pending: applicants.filter((a) => a.status === 'pending'),
        accepted: applicants.filter((a) => a.status === 'accepted' && a.role !== 'host'),
    }
}

/** 신청 처리 실패 → 화면에 보여줄 문구 · 트리거가 직접 만든 한국어 문구(정원 가득 등)는 그대로 쓴다 */
function respondErrorMessage({code, message}) {
    if (/[가-힣]/.test(message)) return message
    if (code === '42501') return '이 신청은 처리할 수 없어요'
    return '처리하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/** 신청 수락 또는 거절 · accept 가 true 면 수락, false 면 거절한다 */
export async function respondToApplicant({postId, userId, accept}) {
    const {data, error} = await supabase
        .from('mate_members')
        .update({status: accept ? 'accepted' : 'rejected'})
        .eq('post_id', postId)
        .eq('user_id', userId)
        .select('user_id')
    if (error) throw Object.assign(new Error(respondErrorMessage(error)), {cause: error})
    // 규칙(RLS)이 막으면 오류 없이 0줄이 바뀐다
    if (data.length === 0) throw new Error('이 신청은 처리할 수 없어요')
}
