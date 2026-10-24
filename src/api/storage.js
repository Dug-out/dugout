// 사진 올리기 실패 → 화면에 보여줄 문구
export function uploadErrorMessage({message = ''}) {
    if (/exceeded|too large|size/i.test(message)) return '사진 용량이 너무 커요 (2MB 이하)'
    if (/mime|type/i.test(message)) return '사진 형식을 확인해 주세요 (jpg, png, webp)'
    return '사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요'
}
