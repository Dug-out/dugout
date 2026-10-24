import InlineMessage from '../InlineMessage/InlineMessage.jsx'
import './Field.css'

/**
 * 라벨 + 입력칸 + 한 줄 메시지 · 입력 50px · radius 12
 * status: idle(기본) | ok(남색 체크 메시지) | error(빨강 테두리 + 느낌표 메시지)
 * message: status에 맞는 메시지. idle이면 hint를 보여준다.
 * multiline: true면 여러 줄 입력칸(textarea). rows 로 줄 수를 정한다.
 * counter: true면 라벨 오른쪽에 글자 수(예: 16/30)를 보여준다. maxLength 와 value 가 있어야 한다.
 * 나머지 props(type, value, onChange, autoComplete, …)는 입력칸으로 그대로 넘어간다.
 */
function Field({id, label, status = 'idle', message, hint, multiline = false, counter = false, className = '', ...inputProps}) {
    const text = status === 'idle' ? hint : message
    const tone = status === 'idle' ? 'hint' : status === 'ok' ? 'success' : 'error'
    const classes = ['field', className].filter(Boolean).join(' ')
    const Input = multiline ? 'textarea' : 'input'

    return (
        <div className={classes}>
            {counter ? (
                <div className="field__label-row">
                    <label htmlFor={id}>{label}</label>
                    <span className="field__counter">{inputProps.value.length}/{inputProps.maxLength}</span>
                </div>
            ) : (
                <label htmlFor={id}>{label}</label>
            )}
            <Input id={id} className={`field__input${multiline ? ' field__input--multiline' : ''}`}
                   aria-invalid={status === 'error' || undefined}
                   aria-describedby={text ? `${id}-msg` : undefined} {...inputProps}/>
            {text && <InlineMessage id={`${id}-msg`} tone={tone}>{text}</InlineMessage>}
        </div>
    )
}

export default Field
