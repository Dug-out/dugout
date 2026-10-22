import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

// "로그인 상태 유지" 선택에 따라 세션 저장 위치를 나눈다.
//  유지(기본): localStorage — 브라우저를 닫아도 로그인 유지
//  유지 안 함: sessionStorage — 탭을 닫으면 로그아웃
const KEEP_KEY = 'dugout.keepLogin'

const keepLogin = () => localStorage.getItem(KEEP_KEY) !== 'false'

export const setKeepLogin = (keep) => localStorage.setItem(KEEP_KEY, String(keep))

const sessionStorageAdapter = {
  getItem: (name) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name, value) => {
    const [target, other] = keepLogin() ? [localStorage, sessionStorage] : [sessionStorage, localStorage]
    target.setItem(name, value)
    other.removeItem(name)
  },
  removeItem: (name) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const supabase = createClient(url, key, {
  auth: { storage: sessionStorageAdapter },
})
