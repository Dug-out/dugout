import {useState} from 'react'
import {BottomSheet, Button, Icon} from '../../../components'
import useSelectableGames from '../../../hooks/load/useSelectableGames.js'
import {matchLabel} from '../../../utils/mateFormat.js'
// 달력 모양은 경기 선택 시트와 같은 것을 쓴다
import './MateGameSheet.css'
import './MateDateSheet.css'

// 요일 머리글
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 같은 날인지 (시각은 보지 않는다)
const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

// 그날 0시
const startOfDay = (value) => {
    const date = new Date(value)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * 직관 날짜 선택 · 목록을 볼 날짜를 고른다 (지난 날은 못 고르고, 내 팀 경기 날은 빨간 점)
 * @param {{myTeam: string | null, initialDate: Date | null,
 *          onApply: (date: Date | null, game: object | null) => void, onClose: () => void}} props
 */
function MateDateSheet({myTeam, initialDate, onApply, onClose}) {
    // 시작 전 내 팀 경기 · 빨간 점 (못 불러오면 점 없이 날짜만 고를 수 있다)
    const {games} = useSelectableGames()

    // 오늘 0시 · 이보다 앞은 지난 날
    const [today] = useState(() => startOfDay(Date.now()))
    // 고른 날 · 이미 고른 날짜가 있으면 그날, 없으면 오늘
    const [picked, setPicked] = useState(() => initialDate ?? today)
    // 보고 있는 달
    const [view, setView] = useState(() => ({year: picked.getFullYear(), month: picked.getMonth()}))

    // 이번 달보다 앞으로는 못 간다
    const canPrev = view.year * 12 + view.month > today.getFullYear() * 12 + today.getMonth()
    const moveMonth = (step) => {
        const date = new Date(view.year, view.month + step, 1)
        setView({year: date.getFullYear(), month: date.getMonth()})
    }

    // 날짜 칸 · 1일 앞의 빈 칸은 null
    const leading = new Date(view.year, view.month, 1).getDay()
    const lastDay = new Date(view.year, view.month + 1, 0).getDate()
    const cells = [...Array.from({length: leading}, () => null), ...Array.from({length: lastDay}, (_, i) => i + 1)]

    // 고른 날의 경기 · 날짜 버튼 문구 'LG vs 두산' 에 쓴다
    const pickedGame = games.find((game) => isSameDay(game.gameAt, picked)) ?? null
    const monthDay = `${String(picked.getMonth() + 1).padStart(2, '0')}.${String(picked.getDate()).padStart(2, '0')}`

    return (
        <BottomSheet open onClose={onClose} label="직관 날짜 선택" closeLabel={null}>
            <div className="mate-game">
                <h2 className="mate-game__title">직관 날짜 선택</h2>

                {/* 달 이동 */}
                <div className="mate-cal__head">
                    <button
                        type="button"
                        className="mate-cal__move"
                        aria-label="이전 달"
                        disabled={!canPrev}
                        onClick={() => moveMonth(-1)}
                    >
                        <Icon name="back" size={20} />
                    </button>
                    <span className="mate-cal__month">
                        {view.year}.{String(view.month + 1).padStart(2, '0')}
                    </span>
                    <button type="button" className="mate-cal__move" aria-label="다음 달" onClick={() => moveMonth(1)}>
                        <Icon name="chevronRight" size={20} />
                    </button>
                </div>

                <div className="mate-cal__week" aria-hidden="true">
                    {WEEKDAYS.map((day, i) => (
                        <span key={day} className={i === 0 ? 'mate-cal__sun' : undefined}>
                            {day}
                        </span>
                    ))}
                </div>

                <div className="mate-cal__grid">
                    {cells.map((day, i) => {
                        if (day === null) return <span key={`blank-${i}`} />
                        const date = new Date(view.year, view.month, day)
                        // 지난 날 · 누를 수 없다
                        if (date < today)
                            return (
                                <span key={day} className="mate-cal__day mate-cal__day--off">
                                    {day}
                                </span>
                            )
                        const game = games.find((g) => isSameDay(g.gameAt, date))
                        return (
                            <button
                                key={day}
                                type="button"
                                className="mate-cal__day mate-date__day"
                                aria-pressed={isSameDay(date, picked)}
                                aria-label={`${view.month + 1}월 ${day}일${game ? ` ${matchLabel(game, myTeam)}` : ''}`}
                                onClick={() => setPicked(date)}
                            >
                                <span className="mate-cal__num">{day}</span>
                                {/* 경기 있는 날은 빨간 점, 없는 날도 같은 높이를 차지한다 */}
                                <span className={game ? 'mate-cal__dot' : 'mate-date__no-dot'} aria-hidden="true" />
                            </button>
                        )
                    })}
                </div>

                <p className="mate-cal__legend">
                    <span className="mate-cal__dot" aria-hidden="true" />
                    {myTeam ?? '우리 팀'} 경기
                </p>

                <div className="mate-cal__actions">
                    <Button variant="secondary" onClick={() => onApply(null, null)}>
                        전체 날짜
                    </Button>
                    <Button block onClick={() => onApply(picked, pickedGame)}>
                        {monthDay} 모집 글 보기
                    </Button>
                </div>
            </div>
        </BottomSheet>
    )
}

export default MateDateSheet
