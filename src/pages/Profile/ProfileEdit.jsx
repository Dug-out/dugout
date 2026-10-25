import {useState} from 'react'
import {useNavigate} from 'react-router'
import {checkNickname} from '../../api/auth.js'
import {updateMyProfile} from '../../api/profiles.js'
import {Button, Chip, Dialog, Field, Header, InlineMessage, LoadState, PhotoPicker, TeamPicker} from '../../components'
import {PROFILE, SIGNUP} from '../../constants/policy.js'
import useAvailability from '../../hooks/useAvailability.js'
import useMyProfile from '../../hooks/useMyProfile.js'
import {availabilityProps} from '../../utils/availability.js'
import './ProfileEdit.css'

// 입력 글자 수 제한 (DB의 headline 30자, bio 300자와 같다)
const HEADLINE_MAX = 30
const BIO_MAX = 300

/** 프로필 수정 · 불러오기에 성공하면 그 값으로 채운 입력 화면을 보여 준다 */
function ProfileEdit() {
    // 내 프로필 불러오기 · status 는 loading | ready | error
    const {status, profile, reload} = useMyProfile()

    return (
        <div className="profile-edit">
            <Header title="프로필 수정" backTo="/my" />
            <LoadState
                status={status}
                errorTitle="내 정보를 불러오지 못했어요"
                onRetry={reload}
                className="profile-edit__state"
            />
            {/* 불러왔을 때 · 불러온 값으로 채운 입력 화면 */}
            {status === 'ready' && <ProfileEditForm profile={profile} />}
        </div>
    )
}

/** 불러온 프로필로 채운 입력 화면 */
function ProfileEditForm({profile}) {
    // 저장하면 마이페이지로 이동할 때 쓴다
    const navigate = useNavigate()

    // 불러온 값으로 시작한다 (이 컴포넌트는 불러온 뒤에야 만들어지므로 처음부터 채워져 있다)
    const [form, setForm] = useState({
        nickname: profile.nickname,
        headline: profile.headline,
        bio: profile.bio,
        age: profile.age,
        gender: profile.gender,
        team: profile.team,
    })

    // 글자 입력칸마다 쓰는 변경 함수 · set('bio') 는 bio 칸이 바뀔 때 form.bio 를 갱신한다
    const set = (key) => (e) => setForm((prev) => ({...prev, [key]: e.target.value}))
    // 버튼으로 고르는 값(나이대 · 성별 · 응원팀)을 저장한다
    const pick = (key, value) => setForm((prev) => ({...prev, [key]: value}))

    // 프로필 사진 변경 · undefined(그대로), Blob(새 사진), null(기본 이미지로 변경)
    const [avatar, setAvatar] = useState(undefined)

    // 저장 요청 중인지 (중복 클릭 방지)
    const [busy, setBusy] = useState(false)
    // 저장 결과 안내 창 · null(안 보임), {ok: true}(성공), {ok: false, message}(실패)
    const [result, setResult] = useState(null)

    // 앞뒤 공백을 뺀 닉네임으로 검사하고 저장한다
    const nickname = form.nickname.trim()
    const nicknameValid = nickname.length >= SIGNUP.NICKNAME_MIN && nickname.length <= SIGNUP.NICKNAME_MAX

    // 원래 닉네임에서 바꿨는지
    const nicknameChanged = nickname !== profile.nickname

    // 닉네임을 바꿨을 때만 중복을 확인한다 (내 현재 닉네임은 "이미 있음"으로 나오기 때문)
    const nicknameResult = useAvailability(nickname, nicknameValid && nicknameChanged, checkNickname)

    // 닉네임이 형식에 맞고, 바꿨다면 사용 가능할 때만 저장할 수 있다
    const canSave = nicknameValid && (!nicknameChanged || nicknameResult === 'ok') && !busy

    // 저장 버튼(또는 엔터)을 눌렀을 때 · 저장하고 결과 안내 창을 띄운다
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!canSave) return
        setBusy(true)
        try {
            await updateMyProfile({...form, nickname, headline: form.headline.trim(), bio: form.bio.trim(), avatar})
            setResult({ok: true})
        } catch (err) {
            setResult({ok: false, message: err.message})
        } finally {
            setBusy(false)
        }
    }

    // 성공 안내 창을 닫을 때 · 마이페이지로 돌아간다
    const goMypage = () => navigate('/my')
    // 실패 안내 창을 닫을 때 · 창만 닫는다
    const closeResult = () => setResult(null)

    return (
        <form className="profile-edit__form" onSubmit={handleSubmit}>
            {/* 프로필 사진 · 고르거나 기본 이미지로 바꾸면 [저장하기]에서 프로필과 함께 저장된다 */}
            <PhotoPicker
                defaultImage={PROFILE.DEFAULT_AVATAR}
                currentUrl={profile.avatar}
                onChange={setAvatar}
                label="프로필 사진"
            />

            {/* 닉네임 · 바꿨을 때만 사용 가능 여부를 보여 준다 */}
            <Field
                id="profile-nick"
                label="닉네임"
                type="text"
                autoComplete="nickname"
                maxLength={SIGNUP.NICKNAME_MAX}
                value={form.nickname}
                onChange={set('nickname')}
                {...(nicknameChanged ? availabilityProps('nickname', nicknameResult) : {})}
            />

            {/* 한 줄 소개 · 30자 */}
            <Field
                id="profile-headline"
                label="한 줄 소개"
                type="text"
                counter
                maxLength={HEADLINE_MAX}
                value={form.headline}
                onChange={set('headline')}
                placeholder="예) 평일 저녁 직관 자주 가요!"
            />

            {/* 자기소개 · 여러 줄, 300자 */}
            <Field
                id="profile-bio"
                label="자기소개"
                multiline
                counter
                rows={5}
                maxLength={BIO_MAX}
                value={form.bio}
                onChange={set('bio')}
                placeholder="예) 평일엔 퇴근하고 잠실 1루 응원석, 주말엔 낮 경기 위주로 다녀요. 응원가 같이 크게 부르고 9회까지 자리 지키는 분이면 좋겠어요!"
            />

            {/* 나이대 · 하나만 고른다 */}
            <fieldset className="profile-edit__group">
                <legend>나이대</legend>
                <div className="profile-edit__chips">
                    {SIGNUP.AGES.map((age) => (
                        <Chip key={age} variant="select" selected={form.age === age} onClick={() => pick('age', age)}>
                            {age}
                        </Chip>
                    ))}
                </div>
            </fieldset>

            {/* 성별 · 하나만 고른다 */}
            <fieldset className="profile-edit__group">
                <legend>성별</legend>
                <div className="profile-edit__chips">
                    {SIGNUP.GENDERS.map((gender) => (
                        <Chip
                            key={gender}
                            variant="select"
                            selected={form.gender === gender}
                            onClick={() => pick('gender', gender)}
                        >
                            {gender}
                        </Chip>
                    ))}
                </div>
            </fieldset>

            {/* 응원팀 · 가입 화면과 같은 선택 목록 */}
            <fieldset className="profile-edit__group">
                <legend>응원팀</legend>
                <TeamPicker value={form.team} onChange={(code) => pick('team', code)} />
                <InlineMessage>팀을 바꿔도 예전 글과 기록은 그대로 남아요</InlineMessage>
            </fieldset>

            {/* 하단에 고정된 저장 버튼 */}
            <div className="profile-edit__footer">
                <Button type="submit" block disabled={!canSave}>
                    {busy ? '저장하는 중…' : '저장하기'}
                </Button>
            </div>

            {/* 저장 성공 · 확인(또는 바깥을 눌러 닫기)하면 마이페이지로 돌아간다 */}
            <Dialog
                open={result?.ok === true}
                onClose={goMypage}
                onConfirm={goMypage}
                image="/assets/pose-yay.png"
                title="프로필을 저장했어요!"
                description="바뀐 내용이 마이페이지에 반영됐어요."
                confirmLabel="확인"
                cancelLabel={null}
                tone="primary"
            />

            {/* 저장 실패 · 확인하면 창만 닫고 입력 화면에 그대로 남는다 */}
            <Dialog
                open={result?.ok === false}
                onClose={closeResult}
                onConfirm={closeResult}
                image="/assets/pose-sad.png"
                title="저장하지 못했어요"
                description={result?.message}
                confirmLabel="확인"
                cancelLabel={null}
                tone="primary"
            />
        </form>
    )
}

export default ProfileEdit
