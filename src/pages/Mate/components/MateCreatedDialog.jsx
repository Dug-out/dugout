import Overlay from '../../../components/Overlay/Overlay.jsx'
// 기존 확인 다이얼로그(Dialog)와 같은 모양을 쓰려고 그 CSS를 가져온다 (Dialog.css는 고치지 않음)
import '../../../components/Dialog/Dialog.css'
import './MateCreatedDialog.css'

/**
 * 모집 글 올리기 완료 창 · 기록 저장 완료(Record-saved · Record-write.dc.html) 모양을 따랐다
 * 흰 카드(radius 22) · 캐릭터 · 제목 19px · 설명 14px · 버튼
 *
 * 기존 Dialog는 [취소][확인] 버튼 2개가 필수라서, 버튼이 [확인] 하나인 완료 창을 따로 만들었다.
 * 딤 배경 · Esc · 배경 눌러 닫기 · 포커스 이동은 Dialog와 같은 Overlay가 맡는다.
 * @param {{open: boolean, onClose: () => void}} props
 */
function MateCreatedDialog({open, onClose}) {
    return (
        <Overlay open={open} onClose={onClose} align="center" labelledBy="mate-created-title">
            <div className="dialog mate-created">
                {/* 신난 캐릭터 · 이미지 목록(Brand-assets)에서 "신난다! 약속 확정"에 쓰는 그림 */}
                <img className="mate-created__image" src="/assets/pose-yay.png" alt="" width="76" height="76"/>
                <h2 id="mate-created-title" className="dialog__title">모집 글을 올렸어요!</h2>
                <p className="dialog__desc">
                    같은 팀 팬의 참여 신청을 기다려 볼까요?<br/>신청이 오면 방장이 수락할 수 있어요.
                </p>
                <button type="button" className="dialog__btn dialog__btn--primary mate-created__ok" onClick={onClose}>
                    확인
                </button>
            </div>
        </Overlay>
    )
}

export default MateCreatedDialog
