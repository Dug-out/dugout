import {createClient} from '@supabase/supabase-js'

// .env 에 적어 둔 Supabase 주소와 공개 키
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

// "true": localStorage — 브라우저를 닫아도 로그인 유지
// "false": sessionStorage — 탭을 닫으면 로그아웃
const KEEP_KEY = 'dugout.keepLogin'

// "로그인 상태 유지" 선택 여부 (적어 둔 값이 없으면 유지하지 않는다)
const keepLogin = () => localStorage.getItem(KEEP_KEY) === 'true'

// "로그인 상태 유지" 선택 여부 변경 함수 (api/auth.js 에서 호출)
export const setKeepLogin = (keep) => localStorage.setItem(KEEP_KEY, String(keep))

// 옵션 - 로그인 세션을 읽고 쓰고 지울 때 부르는 저장소 (기본 localStorage 대신 사용)
const sessionStorageAdapter = {
    // 읽기: 어느 쪽에 저장됐든 찾을 수 있게 둘 다 본다
    getItem: (name) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
    // 저장: 선택한 쪽에 저장하고, 반대쪽에 남은 예전 값은 지운다
    setItem: (name, value) => {
        const [target, other] = keepLogin() ? [localStorage, sessionStorage] : [sessionStorage, localStorage]
        target.setItem(name, value)
        other.removeItem(name)
    },
    // 삭제(로그아웃): 두 곳 모두 지운다
    removeItem: (name) => {
        localStorage.removeItem(name)
        sessionStorage.removeItem(name)
    },
}

// 앱 전체가 함께 쓰는 Supabase 클라이언트 (auth.storage 옵션 주고 생성)
export const supabase = createClient(url, key, {
    auth: {storage: sessionStorageAdapter},
})
