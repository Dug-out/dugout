import {useEffect, useRef, useState} from 'react'
import {Link, useLocation, useNavigate, useParams} from 'react-router'
import {Button, Dialog, EmptyState, Header, Icon, Loading} from '../../components'
import {MATE_POST} from '../../constants/policy.js'
import useGoBack from '../../hooks/useGoBack.js'
import useMatePost from '../../hooks/useMatePost.js'
import useMyTeam from '../../hooks/useMyTeam.js'
import {formatDay, formatTime, matchLabel} from '../../utils/mateFormat.js'
import {formatManner} from '../../utils/manner.js'
import MateApplySheet from './components/MateApplySheet.jsx'
import './MateDetail.css'

// 프로필 사진이 없을 때
const DEFAULT_AVATAR = '/assets/profile-default.png'
// "링크를 복사했어요" 안내가 떠 있는 시간
const TOAST_MS = 2000

/**
 * 모집 글 상세 (Mate-detail.dc.html) · 주소의 id 로 글을 불러와 보여 준다.
 * 글쓰기(MateWrite)가 저장에 성공하면 state.created 와 함께 이 화면으로 와서 "모집 글을 올렸어요!" 창을 띄운다.
 */
function MateDetail() {
    const {id} = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    // status 는 loading | ready | error | notfound
    const {status, post, reload, refresh} = useMatePost(id)

    // 글쓰기에서 막 넘어왔으면 완료 창을 연 채로 시작
    const [createdOpen, setCreatedOpen] = useState(Boolean(location.state?.created))

    // 완료 창 닫기 · 실려 온 state 도 지운다 (새로고침하거나 뒤로 갔다 와도 다시 뜨지 않게)
    const closeCreated = () => {
        setCreatedOpen(false)
        navigate(location.pathname, {replace: true, state: null})
    }

    // 화면 아래 잠깐 뜨는 안내
    const [toast, setToast] = useState('')
    const toastTimer = useRef(null)
    useEffect(() => () => clearTimeout(toastTimer.current), [])
    const showToast = (text) => {
        clearTimeout(toastTimer.current)
        setToast(text)
        toastTimer.current = setTimeout(() => setToast(''), TOAST_MS)
    }

    // 뒤로가기 · 이전 화면이 있으면 그리로, 주소로 바로 들어왔으면 홈으로
    const goBack = useGoBack()

    // 공유 · 휴대폰은 공유 창(카카오톡 · 문자 등), 공유 창이 없는 브라우저는 주소 복사
    const share = async () => {
        const url = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({title: post.title, url})
            } catch {
                // 공유 창에서 사용자가 취소한 경우 · 아무것도 하지 않는다
            }
            return
        }
        try {
            await navigator.clipboard.writeText(url)
            showToast('링크를 복사했어요')
        } catch {
            showToast('링크를 복사하지 못했어요')
        }
    }

    // 신청이 끝났을 때 · 상태를 다시 불러와 아래 버튼을 "수락을 기다리고 있어요"로 바꾼다
    const handleApplied = () => {
        refresh()
        showToast('참여 신청을 보냈어요')
    }

    return (
        <div className="mate-detail">
            <Header
                title=""
                onBack={goBack}
                right={
                    status === 'ready' && (
                        <button type="button" className="mate-detail__share" aria-label="공유" onClick={share}>
                            <Icon name="share" size={22} strokeWidth={1.8}/>
                        </button>
                    )
                }
           />

            {/* 불러오는 중 */}
            {status === 'loading' && <Loading/>}
            {/* 불러오지 못했을 때 · 다시 시도 버튼 */}
            {status === 'error' && (
                <EmptyState
                    title="모집 글을 불러오지 못했어요"
                    description="잠시 후 다시 시도해 주세요"
                    action={
                        <Button variant="small-outline" onClick={reload}>
                            다시 시도
                        </Button>
                    }
               />
            )}
            {/* 없는 글이거나 다른 팀 글 */}
            {status === 'notfound' && (
                <EmptyState
                    title="모집 글을 찾을 수 없어요"
                    description="삭제됐거나 볼 수 없는 글이에요"
                    action={
                        <Button as={Link} to="/home" variant="small-outline">
                            홈으로
                        </Button>
                    }
               />
            )}
            {status === 'ready' && <PostContent post={post} onApplied={handleApplied}/>}

            {/* 올리기 완료 창 */}
            <Dialog
                open={createdOpen}
                onClose={closeCreated}
                onConfirm={closeCreated}
                image="/assets/pose-yay.png"
                title="모집 글을 올렸어요!"
                description={
                    <>
                        같은 팀 팬의 참여 신청을 기다려 볼까요?
                        <br/>
                        신청이 오면 방장이 수락할 수 있어요.
                    </>
                }
                confirmLabel="확인"
                cancelLabel={null}
                tone="primary"
           />

            {/* 안내 문구 · role="status": 화면 읽기 프로그램이 문구를 읽어 준다 */}
            {toast && (
                <p className="mate-detail__toast" role="status">
                    {toast}
                </p>
            )}
        </div>
    )
}

/** 불러온 글 · 이미지, 제목과 방장, 정보 카드, 소개, 함께 가는 메이트, 아래 신청 영역 */
function PostContent({post, onApplied}) {
    // 내 응원팀 · 경기 이름을 내 팀 먼저 쓸 때 쓴다
    const myTeam = useMyTeam()
    // 참여 신청 시트가 열려 있는지
    const [applyOpen, setApplyOpen] = useState(false)

    const {title, imageUrl, isOpen, host, game, seat, ages, gender, description, capacity, joinedCount, members} = post
    // 남은 자리 / 인원 막대 길이
    const left = capacity - joinedCount
    const percent = Math.min(100, (joinedCount / capacity) * 100)

    return (
        <>
            {/* 대표 이미지 · 없으면 기본 이미지 */}
            <img className="mate-detail__hero" src={imageUrl || MATE_POST.DEFAULT_IMAGE} alt="" width="390" height="220"/>

            {/* 배지 · 제목 · 방장 (누르면 방장 프로필) */}
            <section className="mate-detail__top">
                <span className={`mate-detail__badge${isOpen ? '' : ' mate-detail__badge--closed'}`}>
                    {isOpen ? '모집 중' : '모집 마감'}
                </span>
                <h1 className="mate-detail__title">{title}</h1>
                <Link to={`/profile/${host.id}`} className="mate-detail__host">
                    <img src={host.avatarUrl || DEFAULT_AVATAR} alt="" width="40" height="40"/>
                    <span className="mate-detail__host-text">
                        <span className="mate-detail__host-name">
                            {host.nickname}
                            <span className="mate-detail__host-tag">방장</span>
                        </span>
                        <span className="mate-detail__host-manner">
                            매너 타율 <strong>{formatManner(host.manner)}</strong>
                        </span>
                    </span>
                    <Icon name="chevronRight" size={18}/>
                </Link>
            </section>

            <main className="mate-detail__body">
                {/* 정보 카드 · [아이콘] [이름 52px] [값] 다섯 줄 */}
                <dl className="mate-detail__info">
                    <InfoRow icon={<Icon name="calendar" size={20} strokeWidth={1.8}/>} label="경기">
                        {formatDay(game.gameAt)} {formatTime(game.gameAt)} {matchLabel(game, myTeam)}
                        <span className="mate-detail__info-sub">{game.stadium}</span>
                    </InfoRow>
                    <InfoRow icon={<Icon name="my" size={20} strokeWidth={1.8}/>} label="나이대">
                        {ages.length ? ages.join(' · ') : '무관'}
                    </InfoRow>
                    <InfoRow icon={<Icon name="my" size={20} strokeWidth={1.8}/>} label="성별">
                        {gender}
                    </InfoRow>
                    <InfoRow icon={<Icon name="seat" size={20} strokeWidth={1.8}/>} label="좌석">
                        {seat}
                    </InfoRow>
                    <InfoRow icon={<Icon name="mate" size={20} strokeWidth={1.8}/>} label="인원">
                        {joinedCount} / {capacity}명
                        <span className="mate-detail__bar" aria-hidden="true">
                            <span style={{width: `${percent}%`}}/>
                        </span>
                    </InfoRow>
                </dl>

                {/* 소개 · 방장이 쓴 줄바꿈을 그대로 보여 준다 (CSS white-space: pre-line) */}
                {description && (
                    <section className="mate-detail__section">
                        <h2 className="mate-detail__h2">소개</h2>
                        <p className="mate-detail__description">{description}</p>
                    </section>
                )}

                {/* 함께 가는 메이트 · 수락된 사람(방장 먼저) + 빈 자리 */}
                <section className="mate-detail__section">
                    <h2 className="mate-detail__h2">함께 가는 메이트 {joinedCount}</h2>
                    <ul className="mate-detail__members">
                        {members.map((member) => {
                            const isMe = member.userId === post.myId
                            return (
                                <li key={member.userId} className={`mate-detail__member${isMe ? ' mate-detail__member--me' : ''}`}>
                                    <Link to={`/profile/${member.userId}`} className="mate-detail__member-link">
                                        <span className="mate-detail__avatar">
                                            <img src={member.avatarUrl || DEFAULT_AVATAR} alt="" width="48" height="48"/>
                                            {/* 보는 사람 본인은 남색 테두리 + "나" 표시 */}
                                            {isMe && <span className="mate-detail__me-tag">나</span>}
                                        </span>
                                        <span className="mate-detail__member-name">{member.nickname}</span>
                                    </Link>
                                </li>
                            )
                        })}
                        {/* 빈 자리 · 남은 자리 수를 점선 원 하나에 "+3"으로 */}
                        {left > 0 && (
                            <li className="mate-detail__member">
                                <span className="mate-detail__empty-seat">+{left}</span>
                                <span className="mate-detail__member-name mate-detail__member-name--empty">빈 자리</span>
                            </li>
                        )}
                    </ul>
                </section>
            </main>

            <ApplyBar post={post} onApply={() => setApplyOpen(true)}/>

            {/* 참여 신청 시트 · 열 때마다 새로 만들어 입력이 비어 있다 */}
            {applyOpen && (
                <MateApplySheet
                    postId={post.id}
                    onClose={() => setApplyOpen(false)}
                    onApplied={() => {
                        setApplyOpen(false)
                        onApplied()
                    }}
               />
            )}
        </>
    )
}

// 신청할 수 없는 이유 → 아래 버튼에 쓰는 문구 (내 신청 상태 기준)
const STATUS_LABEL = {
    pending: '수락을 기다리고 있어요',
    rejected: '참여 신청이 거절됐어요',
    left: '참여를 취소한 모집 글이에요',
}

/** 화면 아래 고정 영역 · 보는 사람과 글의 상태에 따라 버튼이 달라진다. 방장은 버튼이 없다. */
function ApplyBar({post, onApply}) {
    const {myStatus, isOpen, capacity, joinedCount, game} = post
    // 화면이 뜬 시각 · 렌더링마다 바뀌지 않도록 한 번만 정한다
    const [now] = useState(() => Date.now())

    if (myStatus === 'host') return null

    // 신청 가능한 상태가 아니면 이유를 꺼진 버튼으로 보여 준다
    let disabledLabel = null
    if (myStatus === 'accepted') disabledLabel = '채팅방 입장하기'
    else if (myStatus) disabledLabel = STATUS_LABEL[myStatus]
    else if (!isOpen) disabledLabel = '모집이 마감됐어요'
    else if (joinedCount >= capacity) disabledLabel = '인원이 다 찼어요'
    else if (new Date(game.gameAt).getTime() <= now) disabledLabel = '이미 시작한 경기예요'

    return (
        <div className="mate-detail__bottom">
            {disabledLabel ? (
                <Button block disabled>
                    {disabledLabel}
                </Button>
            ) : (
                <Button block onClick={onApply}>
                    참여 신청하기 · {capacity - joinedCount}자리 남음
                </Button>
            )}
        </div>
    )
}

/** 정보 카드 한 줄 · <dt>이름 <dd>값 (이름-값 목록을 뜻하는 HTML 태그) */
function InfoRow({icon, label, children}) {
    return (
        <div className="mate-detail__info-row">
            {icon}
            <dt className="mate-detail__info-label">{label}</dt>
            <dd className="mate-detail__info-value">{children}</dd>
        </div>
    )
}

export default MateDetail
