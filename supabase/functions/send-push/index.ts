// 푸시 알림 보내기 (Supabase Edge Function) · 한 사람의 모든 기기로 알림을 보낸다
// DB 트리거(supabase/schema/11_push.sql 의 notify_push)가 새 신청 · 수락 · 거절 때 이 함수를 부른다
// 요청: {user_id, title, body, url} · 헤더 x-push-secret 이 PUSH_SECRET 과 같아야 한다
// 비밀값: PUSH_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (예: mailto:내이메일)

// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

Deno.serve(async (req) => {
  // 이 함수는 로그인 확인을 끄고 비밀 문구로 막는다 (DB 가 부르기 때문)
  const secret = Deno.env.get('PUSH_SECRET')
  if (!secret || req.headers.get('x-push-secret') !== secret) {
    return new Response('unauthorized', { status: 401 })
  }

  try {
    const { user_id, title, body, url } = await req.json()
    if (!user_id || !title) return Response.json({ error: 'user_id, title 가 필요해요' }, { status: 400 })

    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') ?? '',
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
    )

    // 서비스 키는 이 함수 안에서만 쓰고 Supabase 가 자동으로 넣어 준다
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', user_id)
    if (error) throw new Error(error.message)

    const payload = JSON.stringify({ title, body, url: url ?? '/' })
    const expired: string[] = []
    let sent = 0

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
          sent += 1
        } catch (err) {
          // 404 · 410 은 기기에서 구독이 사라졌다는 뜻이라 지운다
          if (err.statusCode === 404 || err.statusCode === 410) expired.push(sub.id)
        }
      }),
    )

    if (expired.length > 0) await supabase.from('push_subscriptions').delete().in('id', expired)

    return Response.json({ sent, removed: expired.length })
  } catch (err) {
    return Response.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 })
  }
})
