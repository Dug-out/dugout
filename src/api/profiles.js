import {supabase} from '../lib/supabase.js'
import {uploadErrorMessage} from './storage.js'

// 저장 실패 → 화면에 보여줄 문구 (DB 오류 코드 기준)
function updateErrorMessage({code}) {
    if (code === '23505') return '이미 사용 중인 닉네임이에요'
    if (code === '23514' || code === '23502') return '입력한 내용을 다시 확인해 주세요'
    if (code === '42501') return '프로필을 수정할 수 없어요'
    return '저장하지 못했어요. 잠시 후 다시 시도해 주세요'
}

// 프로필 사진을 저장하는 버킷 (supabase/schema/04_storage.sql)
const AVATAR_BUCKET = 'avatars'

/**
 * 프로필 한 명 · 로그인한 사람은 누구의 프로필이든 볼 수 있다
 * @param {string} id 보려는 사람의 id
 * @returns {Promise<{nickname: string, team: string, gender: string, age: string, headline: string, bio: string, avatar: string | null, manner: number}>}
 *  avatar: 프로필 사진 주소 · 사진을 정하지 않았으면 null (화면이 기본 이미지를 보여 준다)
 */
export async function getProfile(id) {
    const {data, error} = await supabase
        .from('profiles')
        .select('nickname, team, gender, age_group, headline, bio, avatar_url, manner_avg')
        .eq('id', id)
        .single()
    if (error) throw error
    const {nickname, team, gender, age_group: age, headline, bio, avatar_url: avatar, manner_avg: manner} = data
    return {nickname, team, gender, age, headline, bio, avatar, manner: Number(manner)}
}

/** 내 프로필 · 마이페이지와 프로필 수정 화면이 쓴다 */
export async function getMyProfile() {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user
    return getProfile(userId)
}

/**
 * 프로필 사진을 올리고 공개 주소를 돌려준다 · {내 id}/avatar.jpg 에 덮어쓴다
 * 사진을 바꿔도 브라우저가 옛 사진을 보여 주지 않도록 주소 끝에 올린 시각(?v=)을 붙인다.
 * @param {Blob} blob 화면에서 정사각형으로 자른 사진
 */
async function uploadAvatar(blob) {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user
    const path = `${userId}/avatar.jpg`

    const {error} = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, blob, {upsert: true, contentType: 'image/jpeg'})
    if (error) throw Object.assign(new Error(uploadErrorMessage(error)), {cause: error})

    const {data: {publicUrl}} = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    return `${publicUrl}?v=${Date.now()}`
}

/** 올려 둔 프로필 사진 파일을 지운다 · 기본 이미지로 되돌릴 때 쓴다 (이미 없어도 오류 없음) */
async function removeAvatar() {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user
    await supabase.storage.from(AVATAR_BUCKET).remove([`${userId}/avatar.jpg`])
}

/**
 * 프로필 저장 · 닉네임, 한 줄 소개, 자기소개, 나이대, 성별, 응원팀, 프로필 사진
 * avatar: 안 넘기면 사진은 그대로, Blob 이면 그 사진으로 바꾸고, null 이면 기본 이미지로 되돌린다.
 * 실패하면 화면에 그대로 보여줘도 되는 한국어 문구의 Error 가 던져진다.
 * @param {{nickname: string, headline: string, bio: string, age: string, gender: string, team: string, avatar?: Blob | null}} profile
 */
export async function updateMyProfile({nickname, headline, bio, age, gender, team, avatar}) {
    const {data: {session}} = await supabase.auth.getSession()
    const {id: userId} = session.user

    const changes = {nickname, headline, bio, age_group: age, gender, team}
    // 새 사진이면 먼저 올리고 그 주소를 저장한다
    if (avatar instanceof Blob) changes.avatar_url = await uploadAvatar(avatar)
    // 기본 이미지로 되돌리면 주소를 비운다
    if (avatar === null) changes.avatar_url = null

    const {error} = await supabase
        .from('profiles')
        .update(changes)
        .eq('id', userId)
    if (error) throw Object.assign(new Error(updateErrorMessage(error)), {cause: error})

    // 저장이 끝난 뒤에 옛 사진 파일을 정리한다 (실패해도 프로필 저장에는 영향 없음)
    if (avatar === null) removeAvatar().catch(() => {
    })
}
