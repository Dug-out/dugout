const AVAILABILITY = {
    email: {ok: '사용할 수 있는 이메일이에요', taken: '이미 가입된 이메일이에요'},
    nickname: {ok: '멋진 닉네임이에요!', taken: '이미 사용 중인 닉네임이에요'},
}

/** 중복 확인 결과 → Field의 status / message / hint */
export function availabilityProps(kind, result) {
    if (result === 'checking') return {hint: '확인하는 중이에요…'}
    if (result === 'ok') return {status: 'ok', message: AVAILABILITY[kind].ok}
    if (result === 'taken') return {status: 'error', message: AVAILABILITY[kind].taken}
    if (result === 'failed') return {status: 'error', message: '확인하지 못했어요. 잠시 후 다시 시도해 주세요'}
    return {}
}
