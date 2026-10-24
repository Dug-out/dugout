import {useEffect, useRef, useState} from 'react'
import {Icon, InlineMessage} from '../../../components'
import {resizeToBlob} from '../../../utils/cropImage.js'
import './MateImagePicker.css'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
// 고르는 원본 사진의 최대 용량 (줄인 뒤에는 훨씬 작아진다)
const SOURCE_MAX_BYTES = 15 * 1024 * 1024

/**
 * 모집 글 대표 이미지 고르기 · 사진을 고르면 줄여서 미리 보여 주고, 실제 저장은 [모집 글 올리기]에서 한다.
 * @param {{onChange: (image: Blob | null) => void}} props
 *  onChange: 사진을 고르면 줄인 사진(Blob), 지우면 null 을 알려 준다
 */
function MateImagePicker({onChange}) {
    // 미리보기 주소 · 없으면 사진을 고르지 않은 상태
    const [preview, setPreview] = useState(null)
    // 사진을 줄이는 중인지
    const [busy, setBusy] = useState(false)
    // 사진을 고를 때 생긴 안내 문구 (형식, 용량, 처리 실패)
    const [message, setMessage] = useState('')

    // 숨겨 둔 파일 선택 입력 / 미리보기 주소(나중에 정리하려고 기억해 둔다)
    const inputRef = useRef(null)
    const previewRef = useRef(null)

    // 화면을 떠날 때 만들어 둔 미리보기 주소를 정리한다
    useEffect(() => () => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }, [])

    // 파일을 골랐을 때 · 형식과 용량을 확인하고 줄여서 미리보기로 보여 준다
    const handleFile = async (e) => {
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
        setBusy(true)
        const source = URL.createObjectURL(file)
        try {
            const blob = await resizeToBlob(source)
            if (previewRef.current) URL.revokeObjectURL(previewRef.current)
            previewRef.current = URL.createObjectURL(blob)
            setPreview(previewRef.current)
            onChange(blob)
        } catch {
            setMessage('사진을 처리하지 못했어요. 다른 사진으로 시도해 주세요')
        } finally {
            URL.revokeObjectURL(source)
            setBusy(false)
        }
    }

    // 삭제(✕) · 고른 사진을 지우고 기본 이미지로 되돌린다
    const remove = () => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
        setPreview(null)
        setMessage('')
        onChange(null)
    }

    return (
        <div className="mate-write__group">
            <span className="mate-write__label">
                대표 이미지 <small>(선택)</small>
            </span>
            <div className="mate-image">
                {preview ? (
                    <span className="mate-image__preview">
                        <img src={preview} alt="선택한 대표 이미지" width="88" height="88"/>
                        <button type="button" className="mate-image__remove" aria-label="대표 이미지 삭제"
                                onClick={remove}>
                            <Icon name="close" size={14}/>
                        </button>
                    </span>
                ) : (
                    <button type="button" className="mate-image__add" disabled={busy}
                            onClick={() => inputRef.current.click()}>
                        <Icon name="camera" size={24} strokeWidth={1.8}/>
                        {busy ? '처리 중…' : '사진 추가'}
                    </button>
                )}
                <span className="mate-image__hint">
                    {preview ? '목록과 상세 위에 이 사진이 보여요.' : '사진을 올리면 모집 글이 더 눈에 띄어요.'}
                </span>
            </div>
            {message && <InlineMessage tone="error">{message}</InlineMessage>}

            {/* 파일 선택 입력 · 화면에는 보이지 않고 위 버튼에서 대신 연다 */}
            <input ref={inputRef} type="file" accept={ACCEPT.join(',')} hidden onChange={handleFile}/>
        </div>
    )
}

export default MateImagePicker
