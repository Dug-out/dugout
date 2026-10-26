import {supabase} from '../lib/supabase.js'

/** 로그인한 사람의 공개 프로필 (닉네임 · 응원팀 등) */
export async function fetchMyProfile() {
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) return null
    const {data, error} = await supabase
        .from('profiles')
        .select('id, nickname, team, manner_avg')
        .eq('id', user.id)
        .single()
    if (error) throw error
    return data
}
