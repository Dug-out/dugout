import {useCallback, useEffect, useRef, useState} from 'react'
import {getChatMessages, sendChatMessage, subscribeChat} from '../api/chat.js'
import useLoad from './useLoad.js'

/**
 * 채팅방 메시지 · 처음 최근 것을 불러오고, 새 메시지는 실시간으로 뒤에 붙인다 (채팅방이 바뀌면 key={postId} 로 새로 만든다)
 * @param {string} postId 모집 글 id
 * @param {(fresh: object[]) => void} [onArrive] 새 메시지가 도착했을 때 (처음 불러올 때는 부르지 않는다)
 * @returns {{status: 'loading' | 'ready' | 'error', messages: object[], send: (body: string) => Promise<void>, reload: () => void}}
 */
export default function useChatMessages(postId, onArrive) {
    // 1) 처음 채팅방을 열 때 불러온 최근 메시지 · 이 값은 다시 불러오기 전까지 그대로라서 새 메시지를 여기에 못 붙인다
    const {status, data, reload} = useLoad(() => getChatMessages(postId), [postId])

    // 2) 그 뒤에 새로 도착한 메시지 · 새 메시지는 따로 여기에 쌓는다
    const [arrived, setArrived] = useState(/** @type {object[]} */ ([]))

    // 3) 화면에 보여 줄 전체 메시지 = 1) + 2)
    const messages = data ? [...data, ...arrived] : []

    // 마지막 메시지 번호 · 새 메시지는 이 번호보다 뒤의 것만 가져온다
    const lastIdRef = useRef(0)
    useEffect(() => {
        lastIdRef.current = messages.at(-1)?.id ?? 0
    })

    // onArrive 는 매번 새로 만들어져도 구독이 다시 연결되지 않게 ref 에 담아 쓴다
    const onArriveRef = useRef(onArrive)
    useEffect(() => {
        onArriveRef.current = onArrive
    })

    // 새 메시지를 가져와 뒤에 붙인다 (이미 있는 번호는 거른다)
    const fetchNew = useCallback(async () => {
        const fresh = await getChatMessages(postId, {afterId: lastIdRef.current})
        if (fresh.length === 0) return
        setArrived((prev) => [...prev, ...fresh.filter((m) => !prev.some((p) => p.id === m.id))])
        onArriveRef.current?.(fresh)
    }, [postId])

    // 새 메시지 알림이 오면 가져온다
    useEffect(() => subscribeChat(postId, () => fetchNew().catch(() => {})), [postId, fetchNew])

    // 보내기 · 실패하면 한국어 문구의 오류를 던진다
    const send = async (body) => {
        await sendChatMessage(postId, body)
        // 보낸 메시지를 바로 보여 준다 (못 가져와도 실시간으로 곧 도착한다)
        await fetchNew().catch(() => {})
    }

    return {status, messages, send, reload}
}
