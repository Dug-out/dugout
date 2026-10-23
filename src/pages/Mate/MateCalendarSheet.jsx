import {useState} from 'react'
import {BottomSheet, Button} from '../../components'
import MateIcon from './MateIcon.jsx'
import {
    DAYS, addMonths, formatMonthDay, formatYearMonth, isSameDay, startOfMonth, teamLabel, todayStart,
} from './mateFormat.js'
import {useDayCount, useMonthGames} from './useMateData.js'
import './MateCalendarSheet.css'

/**
 * 직관 날짜 선택 달력 시트 (Mate-cal.dc.html)
 *  - 지난 날짜는 회색으로 고를 수 없다
 *  - 내 팀 경기가 있는 날은 숫자 아래 빨간 점
 *  - 고른 날짜는 남색 동그라미
 *  - 아래 버튼: "전체 날짜"(날짜 조건 해제) / "10.22 모집 글 2개 보기"(그 날짜로 목록 보기)
 *
 * 기존 BottomSheet(딤 배경 · Esc · 배경 눌러 닫기 · 스크롤 잠금)를 그대로 쓰고 안쪽만 그린다.
 * @param {{team: string, initialDate: Date | null, openOnly: boolean,
 *          onApply: (date: Date | null, game: object | null) => void, onClose: () => void}} props
 */
function MateCalendarSheet({team, initialDate, openOnly, onApply, onClose}) {
    // useState(() => …): 시트가 처음 열릴 때 한 번만 계산한다 (이미 고른 날짜가 있으면 그 날짜부터)
    const [picked, setPicked] = useState(() => initialDate ?? todayStart()) // 시트 안에서 누른 날짜 (아직 적용 전)
    const [month, setMonth] = useState(() => startOfMonth(initialDate ?? todayStart())) // 보고 있는 달

    // 🔌 이 달의 내 팀 경기 · 고른 날짜의 모집 글 개수
    const games = useMonthGames(team, month)
    const count = useDayCount(team, picked, openOnly) // 목록의 "모집 중만 보기"와 같은 조건으로 센다

    const today = todayStart()
    const isThisMonth = month.getTime() === startOfMonth(today).getTime()

    // 달력 칸 만들기 · 1일이 무슨 요일인지만큼 앞에 빈 칸을 두고, 1일부터 말일까지 채운다
    const blanks = month.getDay() // 0(일)~6(토)
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() // 다음 달 0일 = 이번 달 말일
    const days = Array.from({length: lastDay}, (_, i) => {
        const date = new Date(month.getFullYear(), month.getMonth(), i + 1)
        return {
            date,
            past: date < today, // 지난 날짜
            game: games.find((g) => isSameDay(g.gameAt, date)) ?? null, // 그날 내 팀 경기
            selected: isSameDay(date, picked),
        }
    })

    const pickedGame = games.find((g) => isSameDay(g.gameAt, picked)) ?? null
    // 버튼 문구 · 디자인: 개수를 알면 '10.22 모집 글 2개 보기', 0개이거나 모르면 '10.22 모집 글 보기'
    const applyLabel = count
        ? `${formatMonthDay(picked)} 모집 글 ${count}개 보기`
        : `${formatMonthDay(picked)} 모집 글 보기`

    return (
        // closeLabel={null}: BottomSheet 맨 아래 기본 "닫기" 버튼은 숨긴다 (디자인에 없음)
        <BottomSheet open onClose={onClose} label="직관 날짜 선택" closeLabel={null}>
            <div className="mate-cal">
                {/* 제목 + 달 이동 */}
                <div className="mate-cal__head">
                    <h2 className="mate-cal__title">직관 날짜 선택</h2>
                    {/* 이번 달보다 앞으로는 못 간다 (지난 경기 모집은 없으니까) */}
                    <button type="button" className="mate-cal__nav" aria-label="이전 달"
                            disabled={isThisMonth} onClick={() => setMonth((m) => addMonths(m, -1))}>
                        <MateIcon name="chevronLeft" size={20}/>
                    </button>
                    <span className="mate-cal__month">{formatYearMonth(month)}</span>
                    <button type="button" className="mate-cal__nav" aria-label="다음 달"
                            onClick={() => setMonth((m) => addMonths(m, 1))}>
                        <MateIcon name="chevronRight" size={20}/>
                    </button>
                </div>

                {/* 요일 줄 · 일요일만 빨간 글씨 */}
                <div className="mate-cal__week" aria-hidden="true">
                    {DAYS.map((d) => <span key={d}>{d}</span>)}
                </div>

                {/* 날짜 칸 · 7칸씩 줄바꿈 (CSS grid) */}
                <div className="mate-cal__grid">
                    {Array.from({length: blanks}, (_, i) => <span key={`blank-${i}`}/>)}
                    {days.map(({date, past, game, selected}) => (
                        <div key={date.getDate()} className="mate-cal__cell">
                            {past ? (
                                // 지난 날짜 · 누를 수 없는 글자
                                <span className="mate-cal__day mate-cal__day--past">{date.getDate()}</span>
                            ) : (
                                <button type="button" className="mate-cal__day-btn" aria-pressed={selected}
                                        aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${game ? ` · ${teamLabel(team)} 경기` : ''}`}
                                        onClick={() => setPicked(date)}>
                                    <span className={`mate-cal__day${selected ? ' mate-cal__day--selected' : ''}`}>
                                        {date.getDate()}
                                    </span>
                                    {/* 경기 있는 날(고르지 않은 칸)만 빨간 점 · 디자인 그대로 */}
                                    <span className={game && !selected ? 'mate-cal__dot' : 'mate-cal__dot-space'}/>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* 범례 · '● LG 경기' */}
                <div className="mate-cal__legend">
                    <span className="mate-cal__legend-dot"/>
                    {teamLabel(team)} 경기
                </div>

                {/* 아래 버튼 2개 · 디자인 너비 비율 1 : 1.6 */}
                <div className="mate-cal__actions">
                    <Button variant="secondary" className="mate-cal__clear" onClick={() => onApply(null, null)}>
                        전체 날짜
                    </Button>
                    <Button className="mate-cal__apply" onClick={() => onApply(picked, pickedGame)}>
                        {applyLabel}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    )
}

export default MateCalendarSheet
