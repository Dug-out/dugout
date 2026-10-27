import {useState} from 'react'
import {leaveMatePost} from '../../api/mateMembers.js'
import {BottomSheet, BottomSheetItem, Dialog, Icon, NoticeDialog} from '../../components'
import useGoBack from '../../hooks/useGoBack.js'
import MateEditSheet from '../Mate/components/MateEditSheet.jsx'

/**
 * 채팅방 ⋯ 메뉴와 거기서 여는 창들 · 참여자는 "채팅방 나가기", 방장은 "모집 글 수정하기"
 * 경기가 시작하기 전에만 할 수 있고, 이미 시작한 모임은 같은 안내만 한다.
 * @param {{post: {id: string, myStatus: string | null, game: {gameAt: string}}, open: boolean, onClose: () => void, onEdited: () => void}} props
 *  onEdited: 방장이 모집 글을 고쳐서 저장했을 때 (글을 다시 불러오게 한다)
 */
function ChatMenu({post, open, onClose, onEdited}) {
    const isHost = post.myStatus === 'host'

    // 나간 뒤에는 모집 글 상세를 건너뛰고 그 앞 화면(메이트 찾기든 내 직관 약속이든 들어온 곳)으로 돌아간다
    const goBack = useGoBack('/mate', 2)

    // 열려 있는 창: 'leave' 나가기 확인 / 'edit' 수정 시트 / 'edited' 수정 완료 안내 / 'started' 할 수 없다는 안내 / null 없음
    const [dialog, setDialog] = useState(null)
    // 나가는 중인지 (중복 클릭 방지) / 실패 안내 문구
    const [leaving, setLeaving] = useState(false)
    const [failure, setFailure] = useState('')

    // 메뉴에서 항목을 골랐을 때 · 경기가 이미 시작했으면 어떤 항목이든 같은 안내를 한다 (고른 순간의 시각으로 가린다)
    const choose = (name) => {
        const started = new Date(post.game.gameAt) <= Date.now()
        onClose()
        setDialog(started ? 'started' : name)
    }

    // 수정 시트가 끝났을 때 · 성공하면 글을 다시 읽고 완료 안내를, 실패하면 실패 안내를 띄운다
    const handleEdited = ({ok, message}) => {
        if (ok) {
            setDialog('edited')
            onEdited()
        } else {
            setDialog(null)
            setFailure(message)
        }
    }

    // 확인 창의 [나가기] · 성공하면 들어온 곳으로, 실패하면 안내 창을 띄운다
    const leave = async () => {
        if (leaving) return
        setLeaving(true)
        try {
            await leaveMatePost(post.id)
            goBack()
        } catch (err) {
            // API 가 만든 한국어 문구를 그대로 보여 준다
            setDialog(null)
            setFailure(err.message)
            setLeaving(false)
        }
    }

    return (
        <>
            <BottomSheet open={open} onClose={onClose} label="채팅방 메뉴">
                {isHost ? (
                    <BottomSheetItem onClick={() => choose('edit')}>
                        <Icon name="edit" size={20} />
                        모집 글 수정하기
                    </BottomSheetItem>
                ) : (
                    <BottomSheetItem danger onClick={() => choose('leave')}>
                        <Icon name="exit" size={20} />
                        채팅방 나가기
                    </BottomSheetItem>
                )}
            </BottomSheet>

            {/* 모집 글 수정 시트 · 열 때마다 새로 만들어 지금 글의 값으로 시작한다 */}
            {dialog === 'edit' && <MateEditSheet post={post} onClose={() => setDialog(null)} onDone={handleEdited} />}

            {/* 나가기 확인 · 되돌릴 수 없어서 빨간 버튼 */}
            <Dialog
                open={dialog === 'leave'}
                onClose={() => setDialog(null)}
                onConfirm={leave}
                title="채팅방을 나갈까요?"
                description={
                    <>
                        나가면 직관 약속이 취소되고
                        <br />
                        채팅방에 알림이 가요.
                    </>
                }
                confirmLabel="나가기"
            />

            {/* 수정 완료 */}
            <NoticeDialog
                open={dialog === 'edited'}
                onClose={() => setDialog(null)}
                kind="success"
                title="모집 글을 수정했어요!"
                description="바뀐 내용이 채팅방과 모집 글에 반영됐어요."
            />

            {/* 이미 시작한 모임 · 수정과 나가기 모두 이 안내 하나 · 확인 버튼만 있다 */}
            <NoticeDialog
                open={dialog === 'started'}
                onClose={() => setDialog(null)}
                kind="failure"
                title="지금은 할 수 없어요"
                description="이미 진행된 모임은 수정하거나 나갈 수 없어요."
            />

            {/* 나가기·수정 실패 */}
            <NoticeDialog
                open={failure !== ''}
                onClose={() => setFailure('')}
                kind="failure"
                title="처리하지 못했어요"
                description={failure}
            />
        </>
    )
}

export default ChatMenu
