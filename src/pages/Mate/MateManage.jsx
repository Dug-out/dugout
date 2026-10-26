import {useState} from 'react'
import {Link, useParams} from 'react-router'
import {respondToApplicant} from '../../api/mateMembers.js'
import {Button, Dialog, Header, Icon, LoadState, NoticeDialog} from '../../components'
import useMateApplicants from '../../hooks/load/useMateApplicants.js'
import useMyTeam from '../../hooks/load/useMyTeam.js'
import {formatDay, formatTime, matchLabel} from '../../utils/mateFormat.js'
import './MateManage.css'
import {PROFILE} from '../../constants/policy.js'

/** 신청자 관리 · 방장이 대기 중인 신청을 수락·거절하고, 수락된 참여자를 확인한다 */
function MateManage() {
    const {id} = useParams()
    // status 는 loading | ready | error | notfound
    const {status, data, reload, refresh} = useMateApplicants(id)

    return (
        <div className="mate-manage">
            <Header title="신청자 관리" backTo={`/mate/${id}`} />
            <LoadState
                status={status}
                errorTitle="신청자 목록을 불러오지 못했어요"
                onRetry={reload}
                notFound={{
                    title: '신청자 관리를 열 수 없어요',
                    description: '내가 올린 모집 글에서만 볼 수 있어요',
                    backTo: '/record',
                    backLabel: '내 직관 약속으로',
                }}
            />
            {status === 'ready' && <ManageContent data={data} refresh={refresh} />}
        </div>
    )
}

/** 불러온 내용 · 위에 모집 현황, 아래에 새 신청과 함께 가는 사람 */
function ManageContent({data, refresh}) {
    const {post, pending, accepted} = data
    const {id, title, capacity, joinedCount, game} = post
    // 내 응원팀 · 경기 이름을 내 팀 먼저 쓸 때 쓴다
    const myTeam = useMyTeam()
    // 정원이 찼으면 수락할 수 없다 (DB 도 한 번 더 막는다)
    const left = capacity - joinedCount
    const full = left <= 0

    // 처리 중인 신청자 (중복 클릭 방지) / 확인을 기다리는 처리 {applicant, accept} / 처리 실패 문구
    const [busyId, setBusyId] = useState(null)
    const [pendingAction, setPendingAction] = useState(null)
    const [failure, setFailure] = useState('')

    // 수락 또는 거절을 보내고, 어느 쪽이든 목록을 다시 불러온다
    const respond = async (applicant, accept) => {
        setBusyId(applicant.userId)
        try {
            await respondToApplicant({postId: id, userId: applicant.userId, accept})
        } catch (err) {
            // API 가 만든 한국어 문구를 그대로 보여 준다
            setFailure(err.message)
        }
        refresh()
        setBusyId(null)
    }

    // 확인 창의 [수락하기] / [거절하기]
    const confirmAction = () => {
        const {applicant, accept} = pendingAction
        setPendingAction(null)
        respond(applicant, accept)
    }

    // 확인 창 문구 · 수락은 남색 버튼, 거절은 되돌릴 수 없어서 빨간 버튼
    const accepting = pendingAction?.accept === true
    const targetName = pendingAction?.applicant.nickname

    return (
        <main className="mate-manage__body">
            {/* 모집 현황 */}
            <section className="mate-manage__summary">
                <p className="mate-manage__game">
                    {formatDay(game.gameAt)} {formatTime(game.gameAt)} · {matchLabel(game, myTeam)}
                </p>
                <p className="mate-manage__title">{title}</p>
                <span className="mate-manage__bar" aria-hidden="true">
                    <span style={{width: `${Math.min(100, (joinedCount / capacity) * 100)}%`}} />
                </span>
                <p className="mate-manage__count">
                    {capacity}명 중 {joinedCount}명 확정 · {full ? '정원이 가득 찼어요' : `${left}자리 남음`}
                </p>
            </section>

            <h2 className="mate-manage__heading">새 신청 {pending.length}</h2>
            {pending.length === 0 && <p className="mate-manage__empty">새로 들어온 신청이 없어요</p>}
            {pending.map((applicant) => (
                <ApplicantCard key={applicant.userId} applicant={applicant}>
                    <div className="mate-manage__actions">
                        <Button
                            variant="secondary"
                            disabled={busyId !== null}
                            onClick={() => setPendingAction({applicant, accept: false})}
                        >
                            거절
                        </Button>
                        <Button
                            disabled={busyId !== null || full}
                            onClick={() => setPendingAction({applicant, accept: true})}
                        >
                            {full ? '정원 가득' : '수락'}
                        </Button>
                    </div>
                </ApplicantCard>
            ))}

            {accepted.length > 0 && <h2 className="mate-manage__heading">함께 가요 {accepted.length}</h2>}
            {accepted.map((applicant) => (
                <ApplicantCard key={applicant.userId} applicant={applicant} />
            ))}

            {/* 수락·거절 확인 · 잘못 누르지 않도록 한 번 더 묻는다 */}
            <Dialog
                open={pendingAction !== null}
                onClose={() => setPendingAction(null)}
                onConfirm={confirmAction}
                image={accepting ? '/assets/pose-yay.png' : '/assets/pose-sad.png'}
                title={accepting ? `${targetName}님을 수락할까요?` : '신청을 거절할까요?'}
                description={
                    accepting ? (
                        <>
                            수락하면 {targetName}님이
                            <br />
                            함께 가는 메이트가 돼요.
                        </>
                    ) : (
                        <>
                            {targetName}님의 신청을 거절하면
                            <br />
                            되돌릴 수 없어요.
                        </>
                    )
                }
                cancelLabel="취소"
                confirmLabel={accepting ? '수락하기' : '거절하기'}
                tone={accepting ? 'primary' : 'danger'}
            />

            {/* 처리 실패 */}
            <NoticeDialog
                open={failure !== ''}
                onClose={() => setFailure('')}
                kind="failure"
                title="처리하지 못했어요"
                description={failure}
            />
        </main>
    )
}

/** 신청자 한 명 · 사진(프로필 링크), 닉네임, 나이대·응원팀, 상태, 한마디. 아래에 버튼을 children 으로 붙인다 */
function ApplicantCard({applicant, children}) {
    const {userId, nickname, avatarUrl, age, team, status, message} = applicant
    const pending = status === 'pending'

    return (
        <div className="mate-manage__card">
            <div className="mate-manage__who">
                <Link to={`/profile/${userId}`} className="mate-manage__avatar" aria-label={`${nickname} 프로필 보기`}>
                    <img src={avatarUrl || PROFILE.DEFAULT_AVATAR} alt="" width="44" height="44" />
                </Link>
                <div className="mate-manage__name">
                    <p className="mate-manage__nickname">{nickname}</p>
                    <p className="mate-manage__meta">
                        {age} · {team}
                    </p>
                </div>
                {pending ? (
                    <span className="mate-manage__state mate-manage__state--pending">대기 중</span>
                ) : (
                    <span className="mate-manage__state mate-manage__state--accepted">
                        <Icon name="check" size={14} />
                        수락함
                    </span>
                )}
            </div>
            {message && <p className="mate-manage__message">{message}</p>}
            {children}
        </div>
    )
}

export default MateManage
