import {useEffect, useRef, useState} from 'react'
import {AvatarCropper, BottomSheet, BottomSheetItem, Icon, InlineMessage} from '../../components'
import './AvatarPicker.css'

const DEFAULT_AVATAR = '/assets/profile-default.png'
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const SOURCE_MAX_BYTES = 15 * 1024 * 1024 // 고르는 원본 사진의 최대 용량 (자른 뒤에는 훨씬 작아진다)

/**
 * 프로필 사진 바꾸기 · 사진을 누르면 "사진 선택하기 / 기본 이미지로 변경"이 나오고,
 * 사진을 고르면 정사각형으로 자르는 화면이 뜬다. 실제 저장은 프로필 [저장하기]에서 한다.
 * @param {{currentUrl: string | null, onChange: (avatar: Blob | null) => void}} props
 *  currentUrl: 지금 저장된 사진 주소 (없으면 null)
 *  onChange: 새 사진을 자르면 Blob, 기본 이미지로 바꾸면 null 을 알려 준다
 */
function AvatarPicker({currentUrl, onChange}) {
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
        <div className="avatar-picker">
            {/* 사진 · 누르면 시트가 열린다 */}
            <button type="button" className="avatar-picker__photo" aria-label="프로필 사진 변경"
                    onClick={() => setSheetOpen(true)}>
                <img src={shown ?? DEFAULT_AVATAR} alt="" width="512" height="512"/>
                <span className="avatar-picker__camera" aria-hidden="true">
                    <Icon name="camera" size={18}/>
                </span>
            </button>
            {message && <InlineMessage tone="error">{message}</InlineMessage>}

            {/* 파일 선택 입력 · 화면에는 보이지 않고 위 시트에서 대신 연다 */}
            <input ref={inputRef} type="file" accept={ACCEPT.join(',')} hidden onChange={handleFile}/>

            {/* 사진 선택하기 / 기본 이미지로 변경 (사진이 이미 기본이면 뒤쪽은 숨긴다) */}
            <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="프로필 사진">
                <BottomSheetItem onClick={choosePhoto}>사진 선택하기</BottomSheetItem>
                {shown !== null && <BottomSheetItem onClick={resetToDefault}>기본 이미지로 변경</BottomSheetItem>}
            </BottomSheet>

            {/* 정사각형으로 자르는 화면 */}
            {cropSrc && <AvatarCropper src={cropSrc} onDone={handleCropped} onCancel={closeCropper}/>}
        </div>
    )
}

export default AvatarPicker
