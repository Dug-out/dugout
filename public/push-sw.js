// 푸시 알림 · 자동으로 만들어지는 서비스 워커가 이 파일도 함께 불러온다 (vite.config.js 의 importScripts)

// 푸시가 오면 알림을 띄운다 · 서버가 보내는 값은 {title, body, url}
self.addEventListener('push', (event) => {
    let data = {}
    try {
        data = event.data ? event.data.json() : {}
    } catch {
        data = {body: event.data ? event.data.text() : ''}
    }

    event.waitUntil(
        self.registration.showNotification(data.title || '덕아웃', {
            body: data.body || '',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            data: {url: data.url || '/'},
        }),
    )
})

// 알림을 누르면 앱을 열고 그 화면으로 간다 · 이미 열려 있으면 그 창을 쓴다
self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/'

    event.waitUntil(
        (async () => {
            const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true})
            const open = windows.find((client) => 'focus' in client)
            if (open) {
                await open.focus()
                if ('navigate' in open) await open.navigate(url)
                return
            }
            await self.clients.openWindow(url)
        })(),
    )
})
