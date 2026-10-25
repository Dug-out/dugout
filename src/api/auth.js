import {setKeepLogin, supabase} from '../lib/supabase.js'

// supabase 함수는 실패해도 예외를 던지지 않고 {data, error} 로 돌려준다.
// 성공하면 error 가 null 이고, 실패하면 data 가 null 이다.
// 화면에서 쓰는 signIn, signUp 은 실패하면 Error 를 던지고, message 는 그대로 보여줘도 되는 한국어 문구다.

// 로그인 실패 → 화면에 보여줄 문구 (이메일 / 비밀번호 중 무엇이 틀렸는지는 알려주지 않는다)
function signInErrorMessage({message}) {
    if (/invalid login credentials/i.test(message)) return '이메일 또는 비밀번호가 올바르지 않아요'
    return '로그인하지 못했어요. 잠시 후 다시 시도해 주세요'
}

// 가입 실패 → 화면에 보여줄 문구 (DB 트리거가 닉네임 중복 같은 마지막 검사를 한 번 더 한다)
function signUpErrorMessage({message}) {
    if (/already registered/i.test(message)) return '이미 가입된 이메일이에요'
    if (/database error/i.test(message)) return '이미 사용 중인 닉네임이거나 입력값이 올바르지 않아요'
    return '가입하지 못했어요. 잠시 후 다시 시도해 주세요'
}

/**
 * 로그인 · keep=false 이면 탭을 닫을 때 로그아웃된다
 *
 * signInWithPassword: 이메일·비밀번호로 로그인한다.
 *  성공하면 세션(토큰)을 저장소에 알아서 저장하고, 이후 요청에 토큰을 자동으로 붙인다.
 *  이메일이나 비밀번호가 틀리면 error 에 "Invalid login credentials" 가 오고, 이를 한국어 Error 로 바꿔 던진다.
 */
export async function signIn({email, password, keep}) {
    setKeepLogin(keep)
    const {data, error} = await supabase.auth.signInWithPassword({email, password})
    if (error) throw Object.assign(new Error(signInErrorMessage(error)), {cause: error})
    return data
}

/**
 * 가입 · 닉네임·응원팀·성별·나이대를 함께 넘기면 DB 트리거가 profiles 행을 만든다.
 *
 * signUp: 이메일·비밀번호를 이용해 새 계정을 만든다. ("Confirm email" 은 꺼둔 상태)
 *  options.data: 사용자 추가 정보. auth.users 의 raw_user_meta_data 에 저장되고,
 *                가입 트리거(handle_new_user)가 여기서 값을 꺼내 profiles 행을 만든다.
 *  이미 가입된 이메일이면 error 에 "User already registered" 가 오고, 이를 한국어 Error 로 바꿔 던진다.
 */
export async function signUp({email, password, nickname, team, gender, age}) {
    setKeepLogin(false)
    const {data, error} = await supabase.auth.signUp({
        email,
        password,
        options: {data: {nickname, team, gender, age_group: age}},
    })
    if (error) throw Object.assign(new Error(signUpErrorMessage(error)), {cause: error})
    return data
}

/**
 * 사용 가능하면 true, 이미 있으면 false, 확인하지 못했으면 null
 *
 * rpc: DB 에 미리 만들어 둔 함수를 이름과 매개변수로 호출하는 방법이다.
 *  어떤 권한으로 실행되는지는 rpc 가 아니라 SQL 에서 함수를 만들 때의 옵션이 정한다.
 *  아래 두 함수는 security definer 로 생성되어 함수를 만든 사람(관리자)의 권한으로 실행된다.
 *  로그인 전에는 이메일과 닉네임을 직접 조회할 수 없어 함수가 대신 조회해 true/false 만 알려 준다.
 */
async function rpcAvailable(fn, args) {
    const {data, error} = await supabase.rpc(fn, args)
    return error ? null : data
}

export const checkEmail = (email) => rpcAvailable('check_email_available', {e: email})
export const checkNickname = (nickname) => rpcAvailable('check_nickname_available', {n: nickname})

/**
 * 저장된 로그인 세션을 한 번 읽는다 · 토큰이 만료됐으면 갱신을 시도한다
 *
 * getSession: 서버에 묻지 않고 브라우저 저장소를 읽어서 빠르다.
 *  로그인돼 있으면 data.session 에 세션이, 아니면 null 이 들어 있다.
 */
export const getSession = () => supabase.auth.getSession()

/**
 * 로그인 상태가 바뀔 때마다 알려 달라고 등록한다 · 반환값은 구독 해제 함수
 *
 * onAuthStateChange: 앱을 열 때 저장된 세션 확인, 로그인, 로그아웃, 토큰 갱신 때마다 콜백이 불린다.
 *  콜백은 (이벤트 이름, session) 을 받는다. 우리는 session 만 넘겨서 로그인 여부를 판단한다.
 */
export function onAuthChange(callback) {
    const {
        data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
    return () => subscription.unsubscribe()
}
