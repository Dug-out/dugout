// 채팅방 안내 줄(참여 · 나감 · 글 수정 · 삭제)에 쓰는 글자 만들기 함수
// DB 에는 안내의 종류(kind)와 대상만 있고, 문구는 여기서 만든다

/**
 * 안내 줄 문구 · 모르는 종류(나중에 생긴 안내)는 null 이라 화면이 그 줄을 건너뛴다
 * @param {{kind: string, target: {id: string, nickname: string} | null}} message 안내 줄
 * @returns {string | null}
 */
export const chatNotice = ({kind, target}) => {
    if (kind === 'accepted') return `${target.nickname}님이 참여했어요`
    if (kind === 'left') return `${target.nickname}님이 채팅방을 나갔어요`
    if (kind === 'post_edited') return '방장이 모집 글을 수정했어요'
    if (kind === 'deleted') return '방장이 모임을 삭제했어요'
    return null
}
