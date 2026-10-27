// 모집 글의 나이대 · 성별 조건에 내가 맞는지 보는 함수

/**
 * 신청 조건에 맞는지 · 나이대가 비어 있으면 나이 무관, 성별이 '무관' 이면 누구나 신청할 수 있다
 * @param {{ages: string[], gender: string}} post 글의 조건
 * @param {{age: string, gender: string}} me 내 프로필
 * @returns {boolean}
 */
export const meetsApplyCondition = ({ages, gender}, me) =>
    (ages.length === 0 || ages.includes(me.age)) && (gender === '무관' || gender === me.gender)
