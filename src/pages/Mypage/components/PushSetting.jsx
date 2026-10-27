import {useState} from 'react'
import {disablePush, enablePush} from '../../../api/pushSubscriptions.js'
import {NoticeDialog} from '../../../components'
import usePushState from '../../../hooks/load/usePushState.js'
import './PushSetting.css'

// 켤 수 없는 상태의 안내 문구
const UNAVAILABLE = {
    unsupported: '이 기기에서는 지원하지 않아요',
    denied: '브라우저에서 차단되어 있어요',
}

/** 마이페이지 "알림 설정" 줄 · 이 기기에서 새 신청 · 수락 · 거절 알림을 받을지 켜고 끈다 */
function PushSetting() {
    const {status, state, refresh} = usePushState()
    // 바꾸는 중인지 (중복 클릭 방지) / 실패 안내 문구
    const [busy, setBusy] = useState(false)
    const [failure, setFailure] = useState('')

    if (status !== 'ready') return null

    const toggle = async () => {
        if (busy) return
        setBusy(true)
        try {
            if (state === 'on') await disablePush()
            else await enablePush()
        } catch (err) {
            setFailure(err.message)
        } finally {
            setBusy(false)
            refresh()
        }
    }

    // 켤 수 없으면 스위치 대신 이유만 보여 준다
    if (UNAVAILABLE[state]) {
        return (
            <div className="mypage__row push-setting">
                <span className="mypage__row-label">알림 설정</span>
                <span className="push-setting__note">{UNAVAILABLE[state]}</span>
            </div>
        )
    }

    return (
        <>
            <button
                type="button"
                role="switch"
                aria-checked={state === 'on'}
                className="mypage__row push-setting"
                disabled={busy}
                onClick={toggle}
            >
                <span className="mypage__row-label">알림 설정</span>
                <span className="push-setting__note">신청 · 수락 · 거절</span>
                <span className="push-setting__switch" aria-hidden="true" />
            </button>

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
