import Dialog from '../Dialog/Dialog.jsx'

/**
 * 결과 안내 창 · 완료나 실패를 알리고 [확인] 버튼 하나로 닫는다 (물어보는 창은 Dialog 를 그대로 쓴다)
 * 확인을 누르거나 바깥을 눌러도 같은 onClose 가 불린다.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   kind: 'success' | 'failure',   // success: 기뻐하는 캐릭터 / failure: 우는 캐릭터
 *   title: string,
 *   description?: import('react').ReactNode
 * }} props
 */
function NoticeDialog({open, onClose, kind, title, description}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            onConfirm={onClose}
            image={kind === 'success' ? '/assets/pose-yay.png' : '/assets/pose-sad.png'}
            title={title}
            description={description}
            confirmLabel="확인"
            cancelLabel={null}
            tone="primary"
        />
    )
}

export default NoticeDialog
