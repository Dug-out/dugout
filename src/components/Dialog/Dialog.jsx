import {useId} from 'react'
import Overlay from '../Overlay/Overlay.jsx'
import './Dialog.css'

/**
 * 확인 다이얼로그 · radius 22 · 캐릭터 68px · 버튼 48px 2개
 * 나가기 · 삭제처럼 되돌릴 수 없는 행동 직전에 한 번 더 물어볼 때 쓴다. 확인 버튼만 빨강, 취소는 흰색.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onConfirm: () => void,
 *   title: string,
 *   description?: import('react').ReactNode,
 *   image?: string,
 *   cancelLabel?: string | null,   // null이면 취소 버튼 없이 확인 버튼만 (완료·실패 안내 창)
 *   confirmLabel: string,
 *   tone?: 'danger' | 'primary',
 *   className?: string
 * }} props
 */
function Dialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    image = '/assets/pose-sad.png',
    cancelLabel = '취소',
    confirmLabel,
    tone = 'danger',
    className = '',
}) {
    const titleId = useId()

    return (
        <Overlay open={open} onClose={onClose} align="center" labelledBy={titleId}>
            <div className={['dialog', className].filter(Boolean).join(' ')}>
                {image && <img className="dialog__image" src={image} alt="" width="68" height="68" />}
                <h2 id={titleId} className="dialog__title">
                    {title}
                </h2>
                {description && <p className="dialog__desc">{description}</p>}
                <div className={`dialog__actions${cancelLabel === null ? ' dialog__actions--single' : ''}`}>
                    {cancelLabel !== null && (
                        <button type="button" className="dialog__btn dialog__btn--cancel" onClick={onClose}>
                            {cancelLabel}
                        </button>
                    )}
                    <button type="button" className={`dialog__btn dialog__btn--${tone}`} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Overlay>
    )
}

export default Dialog
