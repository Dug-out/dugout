import {useState} from 'react'
import {useNavigate} from 'react-router'
import {checkNickname} from '../../api/auth.js'
import {updateMyProfile} from '../../api/profiles.js'
import {Button, Chip, EmptyState, Field, Header, Icon, InlineMessage, TeamPicker} from '../../components'
import {SIGNUP} from '../../constants/policy.js'
import useAvailability from '../../hooks/useAvailability.js'
import useMyProfile from '../../hooks/useMyProfile.js'
import {availabilityProps} from '../../utils/availability.js'
import './ProfileEdit.css'

const HEADLINE_MAX = 30
const BIO_MAX = 300

/** 프로필 수정 (Profile-edit.dc.html) · 불러오기에 성공하면 그 값으로 채운 입력 화면을 보여 준다 */
function ProfileEdit() {
    const {status, profile, reload} = useMyProfile()

    return (
        <div className="profile-edit">
            <Header title="프로필 수정" backTo="/my"/>
            {status === 'loading' && (
                <EmptyState className="profile-edit__state" image="/assets/loading.png"
                            title="내 정보를 불러오고 있어요"/>
            )}
            {status === 'error' && (
                <EmptyState className="profile-edit__state" image="/assets/pose-sad.png"
                            title="내 정보를 불러오지 못했어요" description="잠시 후 다시 시도해 주세요"
                            action={<Button variant="small-outline" onClick={reload}>다시 시도</Button>}/>
            )}
            {status === 'ready' && <ProfileEditForm profile={profile}/>}
        </div>
    )
}

function ProfileEditForm({profile}) {
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

    // 글자 입력칸마다 쓰는 변경 함수 / 버튼으로 고르는 값을 저장하는 함수
    const set = (key) => (e) => setForm((prev) => ({...prev, [key]: e.target.value}))
    const pick = (key, value) => setForm((prev) => ({...prev, [key]: value}))

    const [busy, setBusy] = useState(false) // 저장 요청 중인지 (중복 클릭 방지)
    const [error, setError] = useState('') // 버튼 위에 보여줄 오류 문구

    const nickname = form.nickname.trim()
    const nicknameValid = nickname.length >= SIGNUP.NICKNAME_MIN && nickname.length <= SIGNUP.NICKNAME_MAX
    const nicknameChanged = nickname !== profile.nickname

    // 닉네임을 바꿨을 때만 중복을 확인한다 (내 현재 닉네임은 "이미 있음"으로 나오기 때문)
    const nicknameResult = useAvailability(nickname, nicknameValid && nicknameChanged, checkNickname)

    // 닉네임이 형식에 맞고, 바꿨다면 사용 가능할 때만 저장할 수 있다
    const canSave = nicknameValid && (!nicknameChanged || nicknameResult === 'ok') && !busy

    // 저장 버튼(또는 엔터)을 눌렀을 때 · 저장하고 마이페이지로 돌아간다
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!canSave) return
        setBusy(true)
        setError('')
        try {
            await updateMyProfile({...form, nickname, headline: form.headline.trim(), bio: form.bio.trim()})
            navigate('/my')
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <form className="profile-edit__form" onSubmit={handleSubmit}>
            {/* 프로필 사진 · 사진 변경은 아직 연결하지 않았다 (Storage 준비 후) */}
            <div className="profile-edit__photo">
                <img src="/assets/profile-default.png" alt="프로필 사진" width="512" height="512"/>
                <button type="button" aria-label="사진 변경">
                    <Icon name="camera" size={18}/>
                </button>
            </div>

            <Field id="profile-nick" label="닉네임" type="text" autoComplete="nickname"
                   maxLength={SIGNUP.NICKNAME_MAX} value={form.nickname} onChange={set('nickname')}
                   {...(nicknameChanged ? availabilityProps('nickname', nicknameResult) : {})}/>

            <Field id="profile-headline" label="한 줄 소개" type="text" counter
                   maxLength={HEADLINE_MAX} value={form.headline} onChange={set('headline')}
                   placeholder="예) 평일 저녁 직관 자주 가요!"/>

            <Field id="profile-bio" label="자기소개" multiline counter rows={5}
                   maxLength={BIO_MAX} value={form.bio} onChange={set('bio')}
                   placeholder="예) 평일엔 퇴근하고 잠실 1루 응원석, 주말엔 낮 경기 위주로 다녀요. 응원가 같이 크게 부르고 9회까지 자리 지키는 분이면 좋겠어요!"/>

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
                        <Chip key={gender} variant="select" selected={form.gender === gender}
                              onClick={() => pick('gender', gender)}>
                            {gender}
                        </Chip>
                    ))}
                </div>
            </fieldset>

            {/* 응원팀 · 가입 화면과 같은 선택 목록 */}
            <fieldset className="profile-edit__group">
                <legend>응원팀</legend>
                <TeamPicker value={form.team} onChange={(code) => pick('team', code)}/>
                <InlineMessage>팀을 바꿔도 예전 글과 기록은 그대로 남아요</InlineMessage>
            </fieldset>

            <div className="profile-edit__footer">
                {/* 저장 실패 문구 */}
                {error && <InlineMessage tone="error">{error}</InlineMessage>}
                <Button type="submit" block disabled={!canSave}>{busy ? '저장하는 중…' : '저장하기'}</Button>
            </div>
        </form>
    )
}

export default ProfileEdit
