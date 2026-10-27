// 모집 글의 나이대 · 성별 조건에 내가 맞는지 보는 함수

/**
 * 신청 조건 확인 · 나이대가 비어 있으면 나이 무관, 성별이 '무관' 이면 누구나 신청할 수 있다
 * @param {{ages: string[], gender: string}} post 글의 조건
 * @param {{age: string, gender: string}} me 내 프로필
 * @returns {string | null} 맞으면 null, 안 맞으면 화면에 보여 줄 안내 문구
 */
export const applyConditionMessage = ({ages, gender}, me) => {
    const ageOk = ages.length === 0 || ages.includes(me.age)
    const genderOk = gender === '무관' || gender === me.gender
    if (ageOk && genderOk) return null

    // 글에 걸려 있는 조건만 문구에 쓴다 (예: '30대 · 남성만', '여성만')
    const conditions = [ages.length > 0 && ages.join(' · '), gender !== '무관' && gender].filter(Boolean)
    return `이 모임은 ${conditions.join(' ')}만 신청할 수 있어요`
}
