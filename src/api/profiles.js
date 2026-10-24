import {supabase} from '../lib/supabase.js'

// 저장 실패 → 화면에 보여줄 문구 (DB 오류 코드 기준)
function updateErrorMessage({code}) {
    if (code === '23505') return '이미 사용 중인 닉네임이에요'
    if (code === '23514' || code === '23502') return '입력한 내용을 다시 확인해 주세요'
    if (code === '42501') return '프로필을 수정할 수 없어요'
    return '저장하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/**
 * 내 프로필 · 마이페이지와 프로필 수정 화면이 쓴다
 * @returns {Promise<{nickname: string, team: string, gender: string, age: string, headline: string, bio: string, manner: number}>}
 */
export async function getMyProfile() {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user

    const {data, error} = await supabase
        .from('profiles')
        .select('nickname, team, gender, age_group, headline, bio, manner_avg')
        .eq('id', userId)
        .single()
    if (error) throw error
    const {nickname, team, gender, age_group: age, headline, bio, manner_avg: manner} = data
    return {nickname, team, gender, age, headline, bio, manner: Number(manner)}
}

/**
 * 프로필 저장 · 닉네임, 한 줄 소개, 자기소개, 나이대, 성별, 응원팀
 * 실패하면 화면에 그대로 보여줘도 되는 한국어 문구의 Error 가 던져진다.
 */
export async function updateMyProfile({nickname, headline, bio, age, gender, team}) {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user

    const {error} = await supabase
        .from('profiles')
        .update({nickname, headline, bio, age_group: age, gender, team})
        .eq('id', userId)
    if (error) throw Object.assign(new Error(updateErrorMessage(error)), {cause: error})
}
