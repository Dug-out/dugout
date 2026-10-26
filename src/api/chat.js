import {CHAT} from '../constants/policy.js'
import {supabase} from '../lib/supabase.js'

/**
 * 채팅방 메시지 · 처음엔 최근 CHAT.LOAD_COUNT 개, afterId 가 있으면 그 번호보다 새 메시지 (오래된 것이 앞)
 * 사람의 메시지(kind: message)와 시스템 안내(수락·나감 등)가 섞여 있다 → 안내 문구는 utils/chatNotice.js
 * @param {string} postId 모집 글 id
 * @param {{afterId?: number | null}} [options]
 * @returns {Promise<object[]>} {id, kind, body, createdAt, sender, target}
 */
export async function getChatMessages(postId, {afterId = null} = {}) {
    let query = supabase
        .from('chat_messages')
        .select(
            'id, kind, body, created_at, sender_id, target_id, sender:profiles!sender_id(nickname, avatar_url), target:profiles!target_id(nickname)',
        )
        .eq('post_id', postId)
    query = afterId
        ? query.gt('id', afterId).order('id').limit(CHAT.LOAD_COUNT)
        : query.order('id', {ascending: false}).limit(CHAT.LOAD_COUNT)

    const {data, error} = await query
    if (error) throw error

    const rows = afterId ? data : [...data].reverse()
    return rows.map((row) => {
        const {id, kind, body, created_at: createdAt, sender_id: senderId, target_id: targetId, sender, target} = row
        return {
            id,
            kind,
            body,
            createdAt,
            sender: sender ? {id: senderId, nickname: sender.nickname, avatarUrl: sender.avatar_url} : null,
            target: target ? {id: targetId, nickname: target.nickname} : null,
        }
    })
}

/** 전송 실패 → 화면에 보여줄 문구 */
function sendErrorMessage({code}) {
    if (code === '42501') return '메시지를 보낼 수 없어요. 이 채팅방의 참여자만 보낼 수 있어요'
    if (code === '23514') return '메시지를 다시 확인해 주세요'
    return '메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요'
}

/** 메시지 보내기 · 보낸 메시지는 getChatMessages 로 다시 받는다 */
export async function sendChatMessage(postId, body) {
    const {error} = await supabase.from('chat_messages').insert({post_id: postId, body: body.trim()})
    if (error) throw Object.assign(new Error(sendErrorMessage(error)), {cause: error})
}

/** 새 메시지가 올라오면 onNew 를 부른다 (Supabase Realtime) · 돌려준 함수를 부르면 받기를 멈춘다. 내용은 넘기지 않으니 getChatMessages 로 다시 가져온다 */
export function subscribeChat(postId, onNew) {
    const channel = supabase
        .channel(`chat:${postId}`)
        .on(
            'postgres_changes',
            {event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `post_id=eq.${postId}`},
            () => onNew(),
        )
        .subscribe()
    return () => {
        supabase.removeChannel(channel)
    }
}
