import {useState} from 'react'
import {disablePush, enablePush} from '../../../api/pushSubscriptions.js'
import {Dialog, Icon, NoticeDialog} from '../../../components'
import usePushState from '../../../hooks/load/usePushState.js'
import './PushSetting.css'

// 켤 수 없는 상태의 안내 문구
const UNAVAILABLE = {
    unsupported: '이 기기에서는 지원하지 않아요',
    denied: '브라우저에서 차단되어 있어요',
}

/** 마이페이지 "알림 설정" 줄 · 누르면 켜겠는지(켜져 있으면 끄겠는지) 물어보고, 새 신청 · 수락 · 거절 알림을 이 기기에서 켜고 끈다 */
function PushSetting() {
    const {status, state, refresh} = usePushState()
    // 켜기 · 끄기 확인 창이 열려 있는지 / 바꾸는 중인지 (중복 클릭 방지) / 실패 안내 문구
    const [asking, setAsking] = useState(false)
    const [busy, setBusy] = useState(false)
    const [failure, setFailure] = useState('')

    if (status !== 'ready') return null

    // 켤 수 없으면 눌러도 소용이 없어서 이유만 보여 준다
    if (UNAVAILABLE[state]) {
        return (
            <div className="mypage__row">
                <span className="mypage__row-label">알림 설정</span>
                <span className="push-setting__note">{UNAVAILABLE[state]}</span>
            </div>
        )
    }

    const turningOff = state === 'on'

    // 확인 창의 [켜기] · [끄기]
    const change = async () => {
        if (busy) return
        setBusy(true)
        setAsking(false)
        try {
            if (turningOff) await disablePush()
            else await enablePush()
        } catch (err) {
            setFailure(err.message)
        } finally {
            setBusy(false)
            refresh()
        }
    }

    return (
        <>
            <button type="button" className="mypage__row" disabled={busy} onClick={() => setAsking(true)}>
                <span className="mypage__row-label">알림 설정</span>
                <span className="push-setting__note">{turningOff ? '켜짐' : '꺼짐'}</span>
                <Icon name="chevronRight" size={18} />
            </button>

            <Dialog
                open={asking}
                onClose={() => setAsking(false)}
                onConfirm={change}
                title={turningOff ? '알림을 끄겠어요?' : '알림을 켜겠어요?'}
                description={
                    turningOff ? (
                        <>
                            더 이상 이 기기로
                            <br />새 신청 · 수락 · 거절 알림이 오지 않아요.
                        </>
                    ) : (
                        <>
                            새 참여 신청과 신청 결과를
                            <br />이 기기로 알려 드려요.
                        </>
                    )
                }
                image={turningOff ? '/assets/pose-sad.png' : '/assets/pose-yay.png'}
                confirmLabel={turningOff ? '끄기' : '켜기'}
                tone="primary"
            />

            <NoticeDialog
                open={failure !== ''}
                onClose={() => setFailure('')}
                kind="failure"
                title="알림을 바꾸지 못했어요"
                description={failure}
            />
        </>
    )
}

export default PushSetting
