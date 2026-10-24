import {useState} from 'react'
import Cropper from 'react-easy-crop'
import {cropToBlob} from '../../utils/cropImage.js'
import Button from '../Button/Button.jsx'
import InlineMessage from '../InlineMessage/InlineMessage.jsx'
import Overlay from '../Overlay/Overlay.jsx'
import './AvatarCropper.css'

const ZOOM_MIN = 1
const ZOOM_MAX = 3

/**
 * 프로필 사진 자르기 · 사진을 끌어서 위치를 맞추고 확대한 뒤 [완료]를 누르면 정사각형 사진을 돌려준다
 * @param {{src: string, onDone: (blob: Blob) => void, onCancel: () => void}} props
 *  src: 자를 사진 주소 / onDone: 자른 사진(512×512 JPEG)을 받는다 / onCancel: 취소하거나 바깥을 눌렀을 때
 */
function AvatarCropper({src, onDone, onCancel}) {
    // 사진 위치와 확대 정도
    const [crop, setCrop] = useState({x: 0, y: 0})
    const [zoom, setZoom] = useState(ZOOM_MIN)
    // 지금 보이는 정사각형이 원본 사진의 어느 부분인지 (픽셀) · 사진을 움직일 때마다 갱신된다
    const [area, setArea] = useState(null)

    // 자르는 중인지 / 실패 문구
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    // 완료 버튼 · 고른 부분을 잘라서 넘긴다
    const handleDone = async () => {
        if (!area || busy) return
        setBusy(true)
        setError('')
        try {
            onDone(await cropToBlob(src, area))
        } catch {
            setError('사진을 처리하지 못했어요. 다른 사진으로 시도해 주세요')
            setBusy(false)
        }
    }

    return (
        <Overlay open onClose={onCancel} align="bottom" label="프로필 사진 자르기">
            <div className="avatar-crop">
                <h2 className="avatar-crop__title">사진 자르기</h2>
                <p className="avatar-crop__desc">사진을 끌어서 위치를 맞추고, 확대해서 원하는 부분을 골라 주세요</p>

                {/* 자르는 영역 · 동그라미 안이 프로필 사진으로 쓰인다 */}
                <div className="avatar-crop__area">
                    <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
                             minZoom={ZOOM_MIN} maxZoom={ZOOM_MAX}
                             onCropChange={setCrop} onZoomChange={setZoom}
                             onCropComplete={(_, pixels) => setArea(pixels)}/>
                </div>

                {/* 확대 */}
                <input className="avatar-crop__zoom" type="range" aria-label="확대"
                       min={ZOOM_MIN} max={ZOOM_MAX} step={0.05} value={zoom}
                       onChange={(e) => setZoom(Number(e.target.value))}/>

                {error && <InlineMessage tone="error">{error}</InlineMessage>}

                <div className="avatar-crop__actions">
                    <Button variant="secondary" onClick={onCancel}>취소</Button>
                    <Button onClick={handleDone} disabled={!area || busy}>{busy ? '자르는 중…' : '완료'}</Button>
                </div>
            </div>
        </Overlay>
    )
}

export default AvatarCropper
