import {useEffect, useRef} from 'react'
import {createPortal} from 'react-dom'
import './Overlay.css'

/**
 * BottomSheet · Dialog가 같이 쓰는 바탕 (직접 쓰지 않는다)
 * 딤 배경 + 앱 컨테이너 폭(430px) 안에 패널 배치 · Esc / 배경 터치로 닫기 · 열린 동안 스크롤 잠금 · 닫히면 포커스 복귀
 */
function Overlay({open, onClose, align, label, labelledBy, children}) {
    const panelRef = useRef(null)

    useEffect(() => {
        if (!open) return undefined
        const opener = document.activeElement
        const scrollLock = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        panelRef.current?.focus()

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = scrollLock
            opener?.focus?.()
        }
    }, [open, onClose])

    if (!open) return null

    return createPortal(
        <div className="overlay">
            <div className="overlay__dim" onClick={onClose} aria-hidden="true" />
            <div className={`overlay__frame overlay__frame--${align}`}>
                <div
                    ref={panelRef}
                    className={`overlay__panel overlay__panel--${align}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label={label}
                    aria-labelledby={labelledBy}
                    tabIndex={-1}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body,
    )
}

export default Overlay
