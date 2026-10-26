import {useCallback, useEffect, useRef, useState} from 'react'
import {getChatMessages, sendChatMessage, subscribeChat} from '../api/chat.js'
import useLoad from './useLoad.js'

/**
 * 채팅방 메시지 · 처음 최근 것을 불러오고, 새 메시지는 실시간으로 뒤에 이어 붙인다 (채팅방이 바뀌면 key={postId} 로 새로 만든다)
 * @param {string} postId 모집 글 id
 * @returns {{status: 'loading' | 'ready' | 'error', messages: object[], send: (body: string) => Promise<void>, reload: () => void}}
 *  messages: 오래된 것이 앞 / send: 실패하면 한국어 문구의 오류를 던진다
 */
export default function useChatMessages(postId) {
    // 처음 불러온 메시지(data) / 그 뒤에 도착한 메시지(arrived)
    const {status, data, reload} = useLoad(() => getChatMessages(postId), [postId])
    const [arrived, setArrived] = useState(/** @type {object[]} */ ([]))
    const messages = data ? [...data, ...arrived] : []

    // 화면에 있는 마지막 메시지 번호 · 새 메시지를 가져올 때 afterId 로 넘겨, 이보다 뒤의 것만 받는다
    const lastIdRef = useRef(0)
    useEffect(() => {
        lastIdRef.current = messages.at(-1)?.id ?? 0
    })

    // 새 메시지만 가져와 목록 뒤에 붙인다 (같은 번호가 두 번 들어가지 않게 거른다)
    const fetchNew = useCallback(async () => {
        const fresh = await getChatMessages(postId, {afterId: lastIdRef.current})
        if (fresh.length === 0) return
        setArrived((prev) => [...prev, ...fresh.filter((m) => !prev.some((p) => p.id === m.id))])
    }, [postId])

    // 채팅방을 보는 동안 새 메시지 알림이 오면 가져온다 (실패해도 화면은 그대로 둔다)
    useEffect(() => subscribeChat(postId, () => fetchNew().catch(() => {})), [postId, fetchNew])

    const send = async (body) => {
        await sendChatMessage(postId, body)
        // 내가 보낸 메시지를 바로 보여 준다 (못 가져와도 실시간 알림으로 곧 도착하니 오류로 보지 않는다)
        await fetchNew().catch(() => {})
    }

    return {status, messages, send, reload}
}
