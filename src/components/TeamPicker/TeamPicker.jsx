import {SIGNUP} from '../../constants/policy.js'
import './TeamPicker.css'

// 구단 색을 CSS 변수로 넘긴다 (CSS 변수는 CSSProperties 타입에 없어서 캐스팅)
const teamStyle = (color) => /** @type {import('react').CSSProperties} */ ({'--team-color': color})

/**
 * 응원팀 선택 · 구단 로고와 이름 5열 목록, 고른 구단은 그 구단 색으로 강조된다
 * 가입 화면과 프로필 수정 화면이 같이 쓴다.
 * @param {{value: string | null, onChange: (code: string) => void}} props value 는 고른 구단 코드(예: 'LG')
 */
function TeamPicker({value, onChange}) {
    return (
        <div className="team-picker">
            {SIGNUP.TEAMS.map((team) => (
                <button
                    key={team.code}
                    type="button"
                    className="team-picker__team"
                    style={teamStyle(team.color)}
                    aria-pressed={value === team.code}
                    onClick={() => onChange(team.code)}
                >
                    <span className="team-picker__logo">
                        <img src={team.icon} alt="" width="240" height="240" />
                    </span>
                    {team.label}
                </button>
            ))}
        </div>
    )
}

export default TeamPicker
