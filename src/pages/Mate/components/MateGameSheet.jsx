import {useState} from 'react'
import {BottomSheet, Button, Icon} from '../../../components'
import useSelectableGames from '../../../hooks/useSelectableGames.js'
import {formatDay, formatTime, matchLabel} from '../../../utils/mateFormat.js'
import './MateGameSheet.css'

// 요일 머리글 · 일요일만 빨강
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 날짜 → 같은 날을 찾는 열쇠 ('2026-9-25' · 월은 0부터)
const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

// 달력이 보여 주는 달의 순서 번호 · 달 이동 범위를 비교할 때 쓴다
const monthIndex = (date) => date.getFullYear() * 12 + date.getMonth()

/**
 * 경기 선택 시트 · 글쓰기의 "같이 볼 경기를 골라 주세요"를 누르면 열린다
 * 모집 글 목록의 날짜 달력(Mate.dc.html · Mate-cal.dc.html) 모양을 따랐다.
 * 경기가 있는 날에 빨간 점이 찍히고, 날짜를 누르면 그날 경기가 골라진다. [선택]을 눌러야 글쓰기 화면에 들어간다.
 *
 * 🔌 DB: getSelectableGames() (src/api/mate.js)
 *        시작 전 예정 경기를 빠른 순으로 · 내 팀 경기만 오는 것은 DB 규칙(RLS)이 맡는다
 *        불러오기는 hooks/useSelectableGames.js 가 맡는다
 * @param {{myTeam: string | null, selectedId: number | null, onPick: (game: object) => void, onClose: () => void}} props
 */
function MateGameSheet({myTeam, selectedId, onPick, onClose}) {
    // status 는 loading | ready | error
    const {status, games, reload} = useSelectableGames()

    return (
        // 기존 BottomSheet: 딤 배경 · Esc · 배경 눌러 닫기 · 핸들까지 그려 준다 (아래 버튼은 달력 디자인대로 직접 둔다)
        <BottomSheet open onClose={onClose} label="경기 선택" closeLabel={null}>
            <div className="mate-game">
                <h2 className="mate-game__title">경기 선택</h2>

                {status === 'loading' && <p className="mate-game__state">경기 일정을 불러오고 있어요</p>}

                {status === 'error' && (
                    <div className="mate-game__state">
                        경기 일정을 불러오지 못했어요
                        <Button variant="small-outline" onClick={reload}>다시 시도</Button>
                    </div>
                )}

                {status === 'ready' && games.length === 0 && (
                    <p className="mate-game__state">앞으로 열릴 경기가 없어요</p>
                )}

                {/* 경기를 다 불러온 뒤에 만든다 (처음 보여 줄 달과 골라 둔 경기를 경기 목록으로 정하기 때문) */}
                {status === 'ready' && games.length > 0 && (
                    <GameCalendar games={games} myTeam={myTeam} selectedId={selectedId} onPick={onPick}
                                  onClose={onClose}/>
                )}
            </div>
        </BottomSheet>
    )
}

/** 달력 · 달 이동, 날짜 칸, 고른 경기 안내, [취소] [선택] 버튼 */
function GameCalendar({games, myTeam, selectedId, onPick, onClose}) {
    // 날짜별 경기 · 같은 날 경기가 둘이면 먼저 열리는 경기를 쓴다 (games 는 빠른 순)
    const gameByDay = new Map()
    games.forEach((game) => {
        const key = dayKey(new Date(game.gameAt))
        if (!gameByDay.has(key)) gameByDay.set(key, game)
    })

    // 고른 경기 · 이전에 골라 둔 경기가 있으면 그것으로 시작한다
    const [picked, setPicked] = useState(() => games.find((game) => game.id === selectedId) ?? null)

    // 보고 있는 달 · 고른 경기가 있으면 그 달, 없으면 가장 빠른 경기의 달
    const [view, setView] = useState(() => {
        const date = new Date((picked ?? games[0]).gameAt)
        return {year: date.getFullYear(), month: date.getMonth()}
    })

    // 경기가 있는 달 안에서만 이동한다
    const viewIndex = view.year * 12 + view.month
    const canPrev = viewIndex > monthIndex(new Date(games[0].gameAt))
    const canNext = viewIndex < monthIndex(new Date(games[games.length - 1].gameAt))
    const moveMonth = (step) => {
        const date = new Date(view.year, view.month + step, 1)
        setView({year: date.getFullYear(), month: date.getMonth()})
    }

    // 날짜 칸 · 1일 앞의 빈 칸(요일 맞추기)은 null
    const leading = new Date(view.year, view.month, 1).getDay()
    const lastDay = new Date(view.year, view.month + 1, 0).getDate()
    const cells = [
        ...Array.from({length: leading}, () => null),
        ...Array.from({length: lastDay}, (_, i) => i + 1),
    ]

    return (
        <>
            {/* 달 이동 */}
            <div className="mate-cal__head">
                <button type="button" className="mate-cal__move" aria-label="이전 달" disabled={!canPrev}
                        onClick={() => moveMonth(-1)}>
                    <Icon name="back" size={20}/>
                </button>
                <span className="mate-cal__month">{view.year}.{String(view.month + 1).padStart(2, '0')}</span>
                <button type="button" className="mate-cal__move" aria-label="다음 달" disabled={!canNext}
                        onClick={() => moveMonth(1)}>
                    <Icon name="chevronRight" size={20}/>
                </button>
            </div>

            <div className="mate-cal__week" aria-hidden="true">
                {WEEKDAYS.map((day, i) => (
                    <span key={day} className={i === 0 ? 'mate-cal__sun' : undefined}>{day}</span>
                ))}
            </div>

            <div className="mate-cal__grid">
                {cells.map((day, i) => {
                    if (day === null) return <span key={`blank-${i}`}/>
                    const game = gameByDay.get(`${view.year}-${view.month}-${day}`)
                    // 경기 없는 날 · 고를 수 없다
                    if (!game) return <span key={day} className="mate-cal__day mate-cal__day--off">{day}</span>
                    const isPicked = picked?.id === game.id
                    return (
                        <button key={day} type="button" className="mate-cal__day mate-cal__day--game"
                                aria-pressed={isPicked}
                                aria-label={`${view.month + 1}월 ${day}일 ${matchLabel(game, myTeam)}`}
                                onClick={() => setPicked(game)}>
                            <span className="mate-cal__num">{day}</span>
                            <span className="mate-cal__dot" aria-hidden="true"/>
                        </button>
                    )
                })}
            </div>

            <p className="mate-cal__legend"><span className="mate-cal__dot" aria-hidden="true"/>{myTeam ?? '우리 팀'} 경기</p>

            {/* 고른 경기 안내 · '10.25 (일) 14:00 · KIA vs 삼성 · 챔피언스필드' */}
            <p className="mate-cal__picked" aria-live="polite">
                {picked
                    ? `${formatDay(picked.gameAt)} ${formatTime(picked.gameAt)} · ${matchLabel(picked, myTeam)} · ${picked.stadium}`
                    : '경기가 있는 날짜를 눌러 주세요'}
            </p>

            <div className="mate-cal__actions">
                <Button variant="secondary" onClick={onClose}>취소</Button>
                <Button block disabled={!picked} onClick={() => onPick(picked)}>이 경기로 선택</Button>
            </div>
        </>
    )
}

export default MateGameSheet
