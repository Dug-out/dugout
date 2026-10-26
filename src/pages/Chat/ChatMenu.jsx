import {useState} from 'react'
import {leaveMatePost} from '../../api/mateMembers.js'
import {BottomSheet, BottomSheetItem, Dialog, Icon, NoticeDialog} from '../../components'
import useGoBack from '../../hooks/useGoBack.js'

/**
 * 채팅방 ⋯ 메뉴와 거기서 여는 창들 · 지금은 참여자의 "채팅방 나가기"만 있다 (방장 메뉴는 여기에 더한다)
 * 경기가 시작하기 전에는 확인 뒤에 나가고, 이미 시작한 모임은 나갈 수 없다고 안내만 한다.
 * @param {{post: {id: string, game: {gameAt: string}}, open: boolean, onClose: () => void}} props
 */
function ChatMenu({post, open, onClose}) {
    // 나간 뒤에는 모집 글 상세를 건너뛰고 그 앞 화면(메이트 찾기든 내 직관 약속이든 들어온 곳)으로 돌아간다
    const goBack = useGoBack('/mate', 2)

    // 화면이 뜬 시각 · 경기가 이미 시작했는지 가리는 데 쓴다
    const [now] = useState(() => Date.now())
    const started = new Date(post.game.gameAt) <= now

    // 열려 있는 창: 'leave' 나가기 확인 / 'started' 나갈 수 없다는 안내 / null 없음
    const [dialog, setDialog] = useState(null)
    // 나가는 중인지 (중복 클릭 방지) / 실패 안내 문구
    const [leaving, setLeaving] = useState(false)
    const [failure, setFailure] = useState('')

    // 메뉴에서 [채팅방 나가기]를 골랐을 때
    const chooseLeave = () => {
        onClose()
        setDialog(started ? 'started' : 'leave')
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
                <BottomSheetItem danger onClick={chooseLeave}>
                    <Icon name="exit" size={20} />
                    채팅방 나가기
                </BottomSheetItem>
            </BottomSheet>

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

            {/* 이미 시작한 모임 · 확인 버튼만 있다 */}
            <NoticeDialog
                open={dialog === 'started'}
                onClose={() => setDialog(null)}
                kind="failure"
                title="나가기 불가능해요"
                description="이미 진행된 모임이라 나갈 수 없어요."
            />

            {/* 나가기 실패 */}
            <NoticeDialog
                open={failure !== ''}
                onClose={() => setFailure('')}
                kind="failure"
                title="나가지 못했어요"
                description={failure}
            />
        </>
    )
}

export default ChatMenu
