import InlineMessage from '../InlineMessage/InlineMessage.jsx'
import './Field.css'

/**
 * 라벨 + 입력칸 + 한 줄 메시지 · 입력 50px · radius 12
 * status: idle(기본) | ok(남색 체크 메시지) | error(빨강 테두리 + 느낌표 메시지)
 * message: status에 맞는 메시지. idle이면 hint를 보여준다.
 * 나머지 props(type, value, onChange, autoComplete, …)는 <input>으로 그대로 넘어간다.
 */
function Field({id, label, status = 'idle', message, hint, className = '', ...inputProps}) {
    const text = status === 'idle' ? hint : message
    const tone = status === 'idle' ? 'hint' : status === 'ok' ? 'success' : 'error'
    const classes = ['field', className].filter(Boolean).join(' ')

    return (
        <div className={classes}>
            <label htmlFor={id}>{label}</label>
            <input id={id} className="field__input" aria-invalid={status === 'error' || undefined}
                   aria-describedby={text ? `${id}-msg` : undefined} {...inputProps}/>
            {text && <InlineMessage id={`${id}-msg`} tone={tone}>{text}</InlineMessage>}
        </div>
    )
}

export default Field
