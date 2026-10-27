import {useState} from 'react'
import {updateMatePost} from '../../../api/matePosts.js'
import {BottomSheet, Button, Field} from '../../../components'
import {MATE_POST} from '../../../constants/policy.js'
import './MateEditSheet.css'

/**
 * 모집 글 수정 시트 · 방장이 제목과 소개만 고친다 (경기·좌석·인원·조건은 못 바꾼다)
 * 시트가 열릴 때 만들어지므로 열 때마다 지금 글의 값으로 시작한다.
 * @param {{post: {id: string, title: string, description: string}, onClose: () => void, onDone: (result: {ok: boolean, message?: string}) => void}} props
 *  onDone: 저장이 끝났을 때 성공({ok: true}) 또는 실패({ok: false, message})를 알린다. 시트를 닫고 안내하는 건 부모가 한다.
 */
function MateEditSheet({post, onClose, onDone}) {
    // 고치는 제목과 소개
    const [title, setTitle] = useState(post.title)
    const [description, setDescription] = useState(post.description)
    // 저장 요청 중인지 (중복 클릭 방지)
    const [busy, setBusy] = useState(false)

    // [저장하기] · 성공이든 실패든 결과를 부모에게 알린다
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (busy || !title.trim()) return
        setBusy(true)
        try {
            await updateMatePost(post.id, {title, description})
            onDone({ok: true})
        } catch (err) {
            onDone({ok: false, message: err.message})
        }
    }

    return (
        <BottomSheet open onClose={onClose} label="모집 글 수정" closeLabel={null}>
            <form className="mate-edit" onSubmit={handleSubmit}>
                <h2 className="mate-edit__title">모집 글 수정하기</h2>
                <p className="mate-edit__desc">제목과 소개만 고칠 수 있어요.</p>

                <Field
                    id="mate-edit-title"
                    label="제목"
                    counter
                    maxLength={MATE_POST.TITLE_MAX}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <Field
                    id="mate-edit-description"
                    label="소개"
                    multiline
                    counter
                    rows={5}
                    maxLength={MATE_POST.DESCRIPTION_MAX}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="mate-edit__actions">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        취소
                    </Button>
                    <Button type="submit" block disabled={busy || !title.trim()}>
                        {busy ? '저장하는 중…' : '저장하기'}
                    </Button>
                </div>
            </form>
        </BottomSheet>
    )
}

export default MateEditSheet
