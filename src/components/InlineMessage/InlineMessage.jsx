import Icon from '../Icon/Icon.jsx'
import './InlineMessage.css'

/**
 * 입력칸 아래 한 줄 메시지 · 12px SemiBold
 *  - success: 남색 체크 ("멋진 닉네임이에요!")
 *  - error:   빨강 느낌표 ("이미 가입된 이메일이에요") — 입력칸 테두리는 호출하는 쪽에서 var(--red-500)로 바꾼다
 *  - hint:    아이콘 없는 회색 안내 문구
 * 오류는 스크린리더가 바로 읽도록 role="alert"로 렌더링한다.
 */
function InlineMessage({tone = 'hint', className = '', children, ...rest}) {
    const classes = ['inline-msg', `inline-msg--${tone}`, className].join(' ')

    return (
        <span className={classes} role={tone === 'error' ? 'alert' : undefined} {...rest}>
            {tone === 'success' && <Icon name="check" size={14} strokeWidth={2.6} />}
            {tone === 'error' && <Icon name="alert" size={14} strokeWidth={2.4} />}
            {children}
        </span>
    )
}

export default InlineMessage
