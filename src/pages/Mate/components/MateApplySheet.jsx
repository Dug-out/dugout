import {useState} from 'react'
import {applyToMatePost} from '../../../api/mate.js'
import {BottomSheet, Button, Dialog, Field} from '../../../components'
import {MATE_POST} from '../../../constants/policy.js'
import './MateApplySheet.css'

/**
 * 참여 신청 시트 · 방장에게 한마디를 남기고 신청한다
 * 시트가 열릴 때 만들어지므로 열 때마다 입력이 비어 있다.
 * @param {{postId: string, onClose: () => void, onApplied: () => void}} props
 *  onApplied: 신청이 끝났을 때 (화면이 상태를 다시 불러오고 시트를 닫는다)
 */
function MateApplySheet({postId, onClose, onApplied}) {
    // 방장에게 남기는 한마디
    const [message, setMessage] = useState('')
    // 신청 요청 중인지 (중복 클릭 방지)
    const [busy, setBusy] = useState(false)
    // 신청 실패 안내 창에 보여줄 문구 · 비어 있으면 창을 닫아 둔다
    const [error, setError] = useState('')

    // [신청 보내기] · 성공하면 화면에 알리고, 실패하면 안내 창을 띄운다
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (busy) return
        setBusy(true)
        try {
            await applyToMatePost({postId, message})
            onApplied()
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    return (
        <>
            <BottomSheet open onClose={onClose} label="참여 신청" closeLabel={null}>
                <form className="mate-apply" onSubmit={handleSubmit}>
                    <h2 className="mate-apply__title">참여 신청하기</h2>
                    <p className="mate-apply__desc">방장이 수락하면 채팅방에 들어갈 수 있어요.</p>

                    <Field
                        id="mate-apply-message"
                        label="방장에게 한마디"
                        multiline
                        counter
                        rows={3}
                        maxLength={MATE_POST.APPLY_MESSAGE_MAX}
                        placeholder="예) 안녕하세요! 저도 퇴근하고 직관 가는 직장인이에요. 같이 응원해요!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    <div className="mate-apply__actions">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            취소
                        </Button>
                        <Button type="submit" block disabled={busy}>
                            {busy ? '보내는 중…' : '신청 보내기'}
                        </Button>
                    </div>
                </form>
            </BottomSheet>

            {/* 신청 실패 · 확인하면 창만 닫고 시트에 그대로 남아 다시 시도할 수 있다 */}
            <Dialog
                open={Boolean(error)}
                onClose={() => setError('')}
                onConfirm={() => setError('')}
                image="/assets/pose-sad.png"
                title="신청하지 못했어요"
                description={error}
                confirmLabel="확인"
                cancelLabel={null}
                tone="primary"
            />
        </>
    )
}

export default MateApplySheet
