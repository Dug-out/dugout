import {useEffect, useRef, useState} from 'react'
import {Link, useParams} from 'react-router'
import {Header, Icon, LoadState, NoticeDialog} from '../../components'
import {CHAT, PROFILE} from '../../constants/policy.js'
import useChatMessages from '../../hooks/useChatMessages.js'
import useMatePost from '../../hooks/load/useMatePost.js'
import useMyTeam from '../../hooks/load/useMyTeam.js'
import {chatNotice} from '../../utils/chatNotice.js'
import {formatChatTime, formatDay, formatDday, formatTime, matchLabel} from '../../utils/mateFormat.js'
import './ChatRoom.css'

/** 모집 채팅방 · 글에 수락된 사람(방장 포함)만 들어올 수 있다 */
function ChatRoom() {
    const {id} = useParams()
    // status 는 loading | ready | error | notfound
    const {status, post, reload} = useMatePost(id)

    // 수락되지 않은 사람은 글을 볼 수 있어도 채팅방에는 못 들어온다
    const allowed = post && (post.myStatus === 'host' || post.myStatus === 'accepted')
    const roomStatus = status === 'ready' && !allowed ? 'notfound' : status

    return (
        <div className="chat-room">
            <Header
                title={post?.title ?? ''}
                subtitle={post ? `멤버 ${post.joinedCount}명` : undefined}
                backTo={`/mate/${id}`}
            />
            <LoadState
                status={roomStatus}
                errorTitle="채팅방을 불러오지 못했어요"
                onRetry={reload}
                notFound={{
                    title: '채팅방에 들어갈 수 없어요',
                    description: '참여가 수락된 모집 글의 채팅방에만 들어올 수 있어요',
                    backTo: `/mate/${id}`,
                    backLabel: '모집 글로',
                }}
            />
            {roomStatus === 'ready' && <ChatBody key={post.id} post={post} />}
        </div>
    )
}

/** 불러온 채팅방 · 경기 카드, 메시지 목록, 입력창 */
function ChatBody({post}) {
    const {status, messages, send, reload} = useChatMessages(post.id)
    // 내 응원팀 · 경기 이름을 내 팀 먼저 쓸 때 쓴다
    const myTeam = useMyTeam()
    // 화면이 뜬 시각 · D-day 계산에 쓴다
    const [now] = useState(() => Date.now())

    // 입력한 글 / 보내는 중인지 (중복 전송 방지) / 전송 실패 안내 문구
    const [text, setText] = useState('')
    const [busy, setBusy] = useState(false)
    const [failure, setFailure] = useState('')

    // 메시지가 늘어나면 맨 아래로 내려간다
    const endRef = useRef(/** @type {HTMLDivElement | null} */ (null))
    useEffect(() => {
        endRef.current?.scrollIntoView({block: 'end'})
    }, [messages.length])

    const handleSend = async (e) => {
        e.preventDefault()
        const body = text.trim()
        if (!body || busy) return
        setBusy(true)
        try {
            await send(body)
            setText('')
        } catch (err) {
            // API 가 만든 한국어 문구를 그대로 보여 준다
            setFailure(err.message)
        } finally {
            setBusy(false)
        }
    }

    const {game} = post

    return (
        <>
            {/* 경기 카드 · 누르면 모집 글로 */}
            <Link to={`/mate/${post.id}`} className="chat-room__game">
                <Icon name="calendar" size={18} />
                <span className="chat-room__game-text">
                    <span className="chat-room__game-main">
                        {formatDay(game.gameAt)} {formatTime(game.gameAt)} {matchLabel(game, myTeam)}
                    </span>
                    <span className="chat-room__game-sub">{game.stadium}</span>
                </span>
                <span className="chat-room__dday">{formatDday(game.gameAt, now)}</span>
            </Link>

            <div className="chat-room__list">
                <LoadState status={status} errorTitle="대화를 불러오지 못했어요" onRetry={reload} />
                {status === 'ready' && messages.length === 0 && (
                    <p className="chat-room__empty">아직 대화가 없어요. 첫 인사를 남겨 보세요 🙌</p>
                )}
                {status === 'ready' &&
                    messages.map((message) => {
                        if (message.kind !== 'message') {
                            const notice = chatNotice(message, post)
                            return (
                                notice && (
                                    <p key={message.id} className="chat-room__notice">
                                        {notice}
                                    </p>
                                )
                            )
                        }
                        const {sender, body, createdAt} = message
                        const time = <span className="chat-room__time">{formatChatTime(createdAt)}</span>
                        if (sender.id === post.myId) {
                            return (
                                <div key={message.id} className="chat-room__row chat-room__row--mine">
                                    {time}
                                    <p className="chat-room__bubble chat-room__bubble--mine">{body}</p>
                                </div>
                            )
                        }
                        return (
                            <div key={message.id} className="chat-room__row">
                                <Link
                                    to={`/profile/${sender.id}`}
                                    className="chat-room__avatar"
                                    aria-label={`${sender.nickname} 프로필 보기`}
                                >
                                    <img
                                        src={sender.avatarUrl || PROFILE.DEFAULT_AVATAR}
                                        alt=""
                                        width="512"
                                        height="512"
                                    />
                                </Link>
                                <span className="chat-room__other">
                                    <span className="chat-room__name">
                                        {sender.nickname}
                                        {sender.id === post.host.id && <span className="chat-room__host">방장</span>}
                                    </span>
                                    <span className="chat-room__line">
                                        <p className="chat-room__bubble">{body}</p>
                                        {time}
                                    </span>
                                </span>
                            </div>
                        )
                    })}
                <div ref={endRef} />
            </div>

            <form className="chat-room__form" onSubmit={handleSend}>
                <label htmlFor="chat-input" className="chat-room__label">
                    메시지
                </label>
                <input
                    id="chat-input"
                    className="chat-room__input"
                    type="text"
                    value={text}
                    maxLength={CHAT.MESSAGE_MAX}
                    placeholder="메시지를 입력하세요"
                    autoComplete="off"
                    onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="chat-room__send" aria-label="보내기" disabled={busy || !text.trim()}>
                    <Icon name="send" size={20} />
                </button>
            </form>

            {/* 전송 실패 */}
            <NoticeDialog
                open={failure !== ''}
                onClose={() => setFailure('')}
                kind="failure"
                title="메시지를 보내지 못했어요"
                description={failure}
            />
        </>
    )
}

export default ChatRoom
