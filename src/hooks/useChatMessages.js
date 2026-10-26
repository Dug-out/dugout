import {useCallback, useEffect, useRef, useState} from 'react'
import {getChatMessages, sendChatMessage, subscribeChat} from '../api/chat.js'
import useLoad from './useLoad.js'

/**
 * 채팅방 메시지를 불러오고, 새 메시지를 실시간으로 이어 붙인다. 채팅방(postId)이 바뀌면 화면을 새로 만들어야 한다 (key={postId})
 * @param {string} postId 모집 글 id
 * @returns {{status: 'loading' | 'ready' | 'error', messages: object[], send: (body: string) => Promise<void>, reload: () => void}}
 *  send: 보내기에 실패하면 API 가 만든 한국어 문구의 오류를 던진다 / messages: getChatMessages 의 줄들 (오래된 것이 앞)
 */
export default function useChatMessages(postId) {
    // 처음 불러온 최근 메시지 / 그 뒤에 도착한 메시지
    const {status, data, reload} = useLoad(() => getChatMessages(postId), [postId])
    const [arrived, setArrived] = useState(/** @type {object[]} */ ([]))
    const messages = data ? [...data, ...arrived] : []

    // 가장 최근 메시지 번호 · 새 메시지는 이 번호보다 뒤의 것만 가져온다
    const lastIdRef = useRef(0)
    useEffect(() => {
        lastIdRef.current = messages.at(-1)?.id ?? 0
    })

    // 새로 올라온 메시지를 가져와 이어 붙인다 (이미 있는 번호는 건너뛴다)
    const fetchNew = useCallback(async () => {
        const fresh = await getChatMessages(postId, {afterId: lastIdRef.current})
        if (fresh.length === 0) return
        setArrived((prev) => [...prev, ...fresh.filter((m) => !prev.some((p) => p.id === m.id))])
    }, [postId])

    // 채팅방을 보는 동안 실시간으로 받는다 (받기에 실패해도 화면은 그대로 둔다)
    useEffect(() => subscribeChat(postId, () => fetchNew().catch(() => {})), [postId, fetchNew])

    const send = async (body) => {
        await sendChatMessage(postId, body)
        // 보낸 메시지를 바로 보여 준다 (못 가져와도 실시간으로 곧 도착하니 오류로 보지 않는다)
        await fetchNew().catch(() => {})
    }

    return {status, messages, send, reload}
}
