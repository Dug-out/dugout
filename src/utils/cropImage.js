// 사진 주소 → 불러온 이미지
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('사진을 열 수 없어요'))
        image.src = src
    })
}

/**
 * 사진과 고른 정사각형 부분 → 잘라 만든 JPEG 파일(Blob)
 * @param {string} src 원본 사진 주소
 * @param {{x: number, y: number, width: number, height: number}} area 자를 부분 (원본 사진 기준 픽셀)
 * @param {number} size 만들 사진의 한 변 길이 (px)
 * @returns {Promise<Blob>}
 */
export async function cropToBlob(src, area, size = 512) {
    const image = await loadImage(src)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    // 자른 부분을 size × size 로 줄이거나 늘려서 그린다
    canvas.getContext('2d').drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size)

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('사진을 만들 수 없어요'))), 'image/jpeg', 0.9)
    })
}
