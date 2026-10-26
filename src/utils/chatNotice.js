// 채팅방 안내 줄(수락 · 나감 · 글 수정 · 삭제)에 쓰는 글자 만들기 함수
// DB 에는 안내의 종류(kind)와 대상만 있고, 문구는 보는 사람에 따라 달라서 여기서 만든다

/**
 * 안내 줄 문구 · 줄바꿈은 \n 으로 돌려주니 화면에서 white-space: pre-line 으로 보여 준다
 * 모르는 종류(나중에 생긴 안내)는 null 이라 화면이 그 줄을 건너뛴다
 * @param {{kind: string, target: {id: string, nickname: string} | null}} message 안내 줄
 * @param {{myId: string, myStatus: string | null, host: {nickname: string}}} post 보는 사람 기준의 글 (getMatePost)
 * @returns {string | null}
 */
export const chatNotice = (message, post) => {
    const {kind, target} = message
    if (kind === 'post_edited') return '방장이 모집 글을 수정했어요'
    if (kind === 'deleted') return '방장이 모임을 삭제했어요'
    if (kind === 'left') return `${target.nickname}님이 채팅방을 나갔어요`
    if (kind === 'accepted') {
        // 수락된 본인 → 방장 → 그 밖의 참여자 순으로 문구가 다르다
        if (target.id === post.myId)
            return `${post.host.nickname}님이 나의 참여를 수락했어요\n이제부터 대화를 볼 수 있어요`
        return post.myStatus === 'host'
            ? `${target.nickname}님의 참여를 수락했어요`
            : `${target.nickname}님이 참여했어요`
    }
    return null
}
