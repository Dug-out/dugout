import {setKeepLogin, supabase} from '../lib/supabase.js'

/** 로그인 · keep=false면 탭을 닫을 때 로그아웃된다 */
export function signIn({email, password, keep}) {
    setKeepLogin(keep)
    return supabase.auth.signInWithPassword({email, password})
}

/**
 * 가입 · 프로필(공개)과 비공개 정보(성별·나이대)는 DB 트리거가 한 번에 만든다 (supabase/schema.sql)
 * Confirm email이 꺼져 있으면 가입 직후 세션이 만들어져 로그인된 상태가 된다.
 * 가입 세션은 sessionStorage에 저장한다 (탭을 닫으면 로그아웃, 다음부터는 로그인 화면에서 유지 여부를 고른다).
 */
export function signUp({email, password, nickname, team, gender, age}) {
    setKeepLogin(false)
    return supabase.auth.signUp({
        email,
        password,
        options: {data: {nickname, team, gender, age_group: age}},
    })
}

/** 사용 가능하면 true, 이미 있으면 false, 확인하지 못했으면 null */
async function rpcAvailable(fn, args) {
    const {data, error} = await supabase.rpc(fn, args)
    return error ? null : data
}

export const checkEmail = (email) => rpcAvailable('check_email_available', {e: email})
export const checkNickname = (nickname) => rpcAvailable('check_nickname_available', {n: nickname})

/** 저장된 로그인 세션 확인 · 토큰이 만료됐으면 갱신을 시도한다 */
export const getSession = () => supabase.auth.getSession()

/** 로그인 상태 변화 구독 (앱을 열 때 저장된 세션 확인, 로그인, 로그아웃마다 호출) · 반환값은 구독 해제 함수 */
export function onAuthChange(callback) {
    const {data} = supabase.auth.onAuthStateChange((_event, session) => callback(session))
    return () => data.subscription.unsubscribe()
}
