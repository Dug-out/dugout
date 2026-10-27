import {supabase} from '../lib/supabase.js'

// 푸시 알림 구독 · 이 기기에서 알림을 받을지 켜고 끈다 (알림을 보내는 쪽은 supabase/functions/send-push)

/** 이 브라우저가 푸시 알림을 받을 수 있는지 (홈 화면에 추가하지 않은 iOS 등은 못 받는다) */
export const isPushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

/** 공개 키(base64url 글자) → 구독에 넘기는 바이트 */
function toKeyBytes(base64Url) {
    const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

/** 지금 기기의 알림 상태 · unsupported 지원 안 함 / denied 브라우저에서 차단 / on 켜짐 / off 꺼짐 */
export async function getPushState() {
    if (!isPushSupported()) return 'unsupported'
    if (Notification.permission === 'denied') return 'denied'

    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    return subscription ? 'on' : 'off'
}

/** 알림 켜기 · 허용을 받고 구독해서 저장한다 · 실패하면 한국어 문구의 오류를 던진다 */
export async function enablePush() {
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!publicKey) throw new Error('알림을 켤 수 없어요. 잠시 후 다시 시도해 주세요')

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') throw new Error('알림이 허용되지 않았어요. 브라우저 설정에서 알림을 허용해 주세요')

    // 서비스 워커는 앱을 빌드해 올린 곳에서만 있다
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) throw new Error('지금은 알림을 켤 수 없어요. 앱을 새로 열고 다시 시도해 주세요')

    const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: toKeyBytes(publicKey)}))
    const {endpoint, keys} = subscription.toJSON()

    const {error} = await supabase.rpc('save_push_subscription', {
        p_endpoint: endpoint,
        p_p256dh: keys.p256dh,
        p_auth: keys.auth,
    })
    if (error) throw Object.assign(new Error('알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요'), {cause: error})
}

/** 알림 끄기 · 저장된 구독을 지우고 이 기기의 구독도 취소한다 */
export async function disablePush() {
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) return

    const {error} = await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    if (error) throw Object.assign(new Error('알림을 끄지 못했어요. 잠시 후 다시 시도해 주세요'), {cause: error})

    await subscription.unsubscribe()
}
