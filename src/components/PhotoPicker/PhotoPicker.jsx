import {useEffect, useRef, useState} from 'react'
import BottomSheet from '../BottomSheet/BottomSheet.jsx'
import BottomSheetItem from '../BottomSheet/BottomSheetItem.jsx'
import Icon from '../Icon/Icon.jsx'
import ImageCropper from '../ImageCropper/ImageCropper.jsx'
import InlineMessage from '../InlineMessage/InlineMessage.jsx'
import './PhotoPicker.css'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
// 고르는 원본 사진의 최대 용량 (자른 뒤에는 훨씬 작아진다)
const SOURCE_MAX_BYTES = 15 * 1024 * 1024

/**
 * 사진 고르기 · 기본 이미지를 누르면 "사진 선택하기 / 기본 이미지로 변경"이 나오고,
 * 사진을 고르면 정해진 비율로 자르는 화면이 뜬다. 실제 저장은 이 화면을 쓰는 쪽에서 한다.
 * @param {{defaultImage: string, onChange: (photo: Blob | null) => void, currentUrl?: string | null,
 *          shape?: 'round' | 'rect', aspect?: number, outputWidth?: number, fillWidth?: boolean, label?: string}} props
 *  defaultImage: 사진을 정하지 않았을 때 보이는 기본 이미지 / currentUrl: 지금 저장된 사진 주소 (없으면 null)
 *  onChange: 새 사진을 자르면 Blob, 기본 이미지로 바꾸면 null 을 알려 준다
 *  shape: round 면 동그라미(104px), rect 면 가로를 가득 채우는 직사각형 / aspect: 가로 ÷ 세로 (기본 1)
 *  outputWidth: 자른 사진의 가로 길이 px (기본 512) / fillWidth: 자르는 틀이 가로를 가득 채울지 (rect 용)
 *  label: 시트와 자르기 화면의 이름 (예: '프로필 사진')
 */
function PhotoPicker({
    defaultImage,
    onChange,
    currentUrl = null,
    shape = 'round',
    aspect = 1,
    outputWidth = 512,
    fillWidth = false,
    label = '사진',
}) {
    // 지금 화면에 보여 주는 사진 주소 · null 이면 기본 이미지
    const [shown, setShown] = useState(currentUrl)
    // "사진 선택하기 / 기본 이미지로 변경" 시트가 열려 있는지
    const [sheetOpen, setSheetOpen] = useState(false)
    // 자르는 중인 원본 사진 주소 · 없으면 자르는 화면을 닫아 둔다
    const [cropSrc, setCropSrc] = useState(null)
    // 사진을 고를 때 생긴 안내 문구 (형식·용량 문제)
    const [message, setMessage] = useState('')

    // 숨겨 둔 파일 선택 입력 / 자른 사진의 미리보기 주소(나중에 정리하려고 기억해 둔다)
    const inputRef = useRef(null)
    const previewRef = useRef(null)

    // 화면을 떠날 때 만들어 둔 미리보기 주소를 정리한다
    useEffect(
        () => () => {
            if (previewRef.current) URL.revokeObjectURL(previewRef.current)
        },
        [],
    )

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
        setShown(previewRef.current)
        closeCropper()
        onChange(blob)
    }

    // "기본 이미지로 변경" · 보여 주는 사진을 기본 이미지로 바꾸고 부모에게 알린다
    const resetToDefault = () => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
        setShown(null)
        setSheetOpen(false)
        setMessage('')
        onChange(null)
    }

    return (
        <div className={`photo-picker photo-picker--${shape}`}>
            {/* 사진 · 누르면 시트가 열린다 */}
            <button
                type="button"
                className="photo-picker__photo"
                aria-label={`${label} 변경`}
                onClick={() => setSheetOpen(true)}
            >
                <img
                    src={shown ?? defaultImage}
                    alt=""
                    width={outputWidth}
                    height={Math.round(outputWidth / aspect)}
                    style={{aspectRatio: aspect}}
                />
                <span className="photo-picker__camera" aria-hidden="true">
                    <Icon name="camera" size={18} />
                </span>
            </button>
            {message && <InlineMessage tone="error">{message}</InlineMessage>}

            {/* 파일 선택 입력 · 화면에는 보이지 않고 아래 시트에서 대신 연다 */}
            <input ref={inputRef} type="file" accept={ACCEPT.join(',')} hidden onChange={handleFile} />

            {/* 사진 선택하기 / 기본 이미지로 변경 (사진이 이미 기본이면 뒤쪽은 숨긴다) */}
            <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} label={label}>
                <BottomSheetItem onClick={choosePhoto}>사진 선택하기</BottomSheetItem>
                {shown !== null && <BottomSheetItem onClick={resetToDefault}>기본 이미지로 변경</BottomSheetItem>}
            </BottomSheet>

            {/* 정해진 비율로 자르는 화면 */}
            {cropSrc && (
                <ImageCropper
                    src={cropSrc}
                    onDone={handleCropped}
                    onCancel={closeCropper}
                    aspect={aspect}
                    shape={shape === 'round' ? 'round' : 'rect'}
                    outputWidth={outputWidth}
                    fillWidth={fillWidth}
                    label={`${label} 자르기`}
                />
            )}
        </div>
    )
}

export default PhotoPicker
