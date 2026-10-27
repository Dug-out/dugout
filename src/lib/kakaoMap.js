// 카카오맵 JavaScript SDK 불러오기 · 키(VITE_KAKAO_MAP_KEY)는 브라우저에 실리는 공개용 키이고, 카카오 개발자 콘솔에서 쓰는 도메인만 허용해 둔다

let loading = null

/**
 * 카카오맵 SDK(지도 + 장소·주소 검색 라이브러리)를 한 번만 불러온다
 * @returns {Promise<any>} window.kakao · 키가 없거나 불러오지 못하면 거절된다
 */
export function loadKakaoMaps() {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!key) return Promise.reject(new Error('카카오 지도 키가 없어요'))

    if (!loading) {
        loading = new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`
            script.async = true
            script.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
            script.onerror = () => {
                // 다시 시도할 수 있게 비운다
                loading = null
                script.remove()
                reject(new Error('카카오 지도를 불러오지 못했어요'))
            }
            document.head.appendChild(script)
        })
    }
    return loading
}
