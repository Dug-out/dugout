import Overlay from '../Overlay/Overlay.jsx'
import './BottomSheet.css'

/**
 * 바텀 시트 · 상단 radius 24 · 핸들 40×4
 * 채팅방 ⋯ 메뉴처럼 고를 게 여러 개일 때는 BottomSheetItem을 children으로 넣는다.
 * 되돌릴 수 없는 항목만 danger(빨간 글씨). 맨 아래 닫기 버튼은 closeLabel={null}로 숨길 수 있다.
 * @param {{open: boolean, onClose: () => void, label?: string, closeLabel?: string | null}} props
 */
function BottomSheet({open, onClose, label, closeLabel = '닫기', children}) {
    return (
        <Overlay open={open} onClose={onClose} align="bottom" label={label}>
            <div className="sheet">
                <span className="sheet__handle" aria-hidden="true" />
                {children}
                {closeLabel && (
                    <button type="button" className="sheet__close" onClick={onClose}>
                        {closeLabel}
                    </button>
                )}
            </div>
        </Overlay>
    )
}

export default BottomSheet
