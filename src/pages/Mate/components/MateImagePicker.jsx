import {useEffect, useRef, useState} from 'react'
import {BottomSheet, BottomSheetItem, Icon, ImageCropper, InlineMessage} from '../../../components'
import {MATE_POST} from '../../../constants/policy.js'
import './MateImagePicker.css'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

// 고르는 원본 사진의 최대 용량 (자른 뒤에는 훨씬 작아진다)
const SOURCE_MAX_BYTES = 15 * 1024 * 1024

/**
 * 모집 글 이미지 고르기 · 사진을 줄여서 보여 주고, 실제 저장은 [모집 글 올리기]에서 한다.
 * @param {{onChange: (image: Blob | null) => void}} props
 *  onChange: 사진을 고르면 줄인 사진(Blob), 지우면 null 을 알려 준다
 */
function MateImagePicker({onChange}) {
    // 미리보기 주소 · 없으면 기본 이미지
    const [preview, setPreview] = useState(null)
    // "사진 선택하기 / 기본 이미지로 변경" 시트가 열려 있는지
    const [sheetOpen, setSheetOpen] = useState(false)
    // 자르는 중인 원본 사진 주소 · 없으면 자르는 화면을 닫아 둔다
    const [cropSrc, setCropSrc] = useState(null)
    // 사진을 고를 때 생긴 안내 문구 (형식, 용량)
    const [message, setMessage] = useState('')

    // 숨겨 둔 파일 선택 입력 / 미리보기 주소(나중에 정리하려고 기억해 둔다)
    const inputRef = useRef(null)
    const previewRef = useRef(null)

    // 화면을 떠날 때 만들어 둔 미리보기 주소를 정리한다
    useEffect(() => () => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }, [])

    // "사진 선택하기" · 시트를 닫고 파일 선택 창을 연다
    const choosePhoto = () => {
        setSheetOpen(false)
        inputRef.current.click()
    }

    // 파일을 골랐을 때 · 형식과 용량을 확인하고 자르는 화면을 연다
    const handleFile = (e) => {
        const file = e.target.files[0]
        e.target.value = '' // 같은 사진을 다시 골라도 이 함수가 불리도록 비운다
        if (!file) return
        if (!ACCEPT.includes(file.type)) {
            setMessage('jpg, png, webp 사진만 올릴 수 있어요')
            return
        }
        if (file.size > SOURCE_MAX_BYTES) {
            setMessage('사진 용량이 너무 커요 (15MB 이하)')
            return
        }
        setMessage('')
        setCropSrc(URL.createObjectURL(file))
    }

    // 자르는 화면을 닫으면서 원본 사진 주소를 정리한다
    const closeCropper = () => {
        URL.revokeObjectURL(cropSrc)
        setCropSrc(null)
    }

    // 자르기를 마쳤을 때 · 자른 사진을 미리보기로 보여 주고 부모에게 알린다
    const handleCropped = (blob) => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
        previewRef.current = URL.createObjectURL(blob)
        setPreview(previewRef.current)
        closeCropper()
        onChange(blob)
    }

    // "기본 이미지로 변경" · 고른 사진을 지우고 기본 이미지로 되돌린다
    const resetToDefault = () => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
        setPreview(null)
        setSheetOpen(false)
        setMessage('')
        onChange(null)
    }

    return (
        <div className="mate-write__group">
            <span className="mate-write__label">
                대표 이미지 <small>(선택)</small>
            </span>
            {/* 대표 이미지 · 누르면 시트가 열린다 */}
            <button type="button" className="mate-image__photo" aria-label="대표 이미지 변경"
                    onClick={() => setSheetOpen(true)}>
                <img src={preview ?? MATE_POST.DEFAULT_IMAGE} alt="" width={MATE_POST.IMAGE_WIDTH}
                     height={MATE_POST.IMAGE_HEIGHT}/>
                <span className="mate-image__camera" aria-hidden="true">
                    <Icon name="camera" size={18}/>
                </span>
            </button>
            <p className="mate-image__hint">
                {preview ? '목록과 상세 위에 이 사진이 보여요.' : '사진을 올리면 모집 글이 더 눈에 띄어요.'}
            </p>
            {message && <InlineMessage tone="error">{message}</InlineMessage>}

            {/* 파일 선택 입력 · 화면에는 보이지 않고 아래 시트에서 대신 연다 */}
            <input ref={inputRef} type="file" accept={ACCEPT.join(',')} hidden onChange={handleFile}/>

            {/* 사진 선택하기 / 기본 이미지로 변경 (사진이 이미 기본이면 뒤쪽은 숨긴다) */}
            <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="대표 이미지">
                <BottomSheetItem onClick={choosePhoto}>사진 선택하기</BottomSheetItem>
                {preview && <BottomSheetItem onClick={resetToDefault}>기본 이미지로 변경</BottomSheetItem>}
            </BottomSheet>

            {/* 기본 이미지와 같은 비율로 자르는 화면 */}
            {cropSrc && (
                <ImageCropper src={cropSrc} onDone={handleCropped} onCancel={closeCropper}
                              aspect={MATE_POST.IMAGE_WIDTH / MATE_POST.IMAGE_HEIGHT}
                              outputWidth={MATE_POST.IMAGE_WIDTH} label="대표 이미지 자르기" fillWidth/>
            )}
        </div>
    )
}

export default MateImagePicker
