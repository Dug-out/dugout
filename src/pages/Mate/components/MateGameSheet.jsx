import {BottomSheet, Button} from '../../../components'
import useSelectableGames from '../../../hooks/useSelectableGames.js'
import {formatDay, formatTime, matchLabel} from '../../../utils/mateFormat.js'
import './MateGameSheet.css'

/**
 * 경기 선택 시트 · 글쓰기의 "같이 볼 경기를 골라 주세요"를 누르면 열린다
 * 디자인 파일이 없어서 직관 기록하기(Record-write.dc.html)의 "다녀온 경기" 목록 모양을 따랐다.
 * 경기 하나를 누르면 바로 고르고 시트가 닫힌다.
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
        // 기존 BottomSheet: 딤 배경 · Esc · 배경 눌러 닫기 · 맨 아래 "닫기" 버튼까지 그려 준다
        <BottomSheet open onClose={onClose} label="경기 선택">
            <div className="mate-game">
                <h2 className="mate-game__title">경기 선택</h2>
                <p className="mate-game__desc">아직 시작하지 않은 우리 팀 경기예요</p>

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

                {/* 경기 목록 · 하나만 고르는 목록이라 radiogroup + radio */}
                {status === 'ready' && games.length > 0 && (
                    <div role="radiogroup" aria-label="같이 볼 경기" className="mate-game__list">
                        {games.map((game) => (
                            <button key={game.id} type="button" role="radio" aria-checked={game.id === selectedId}
                                    className="mate-game__item" onClick={() => onPick(game)}>
                                {/* 동그라미 · 고른 경기는 남색 두꺼운 테두리 (Record-write 모양) */}
                                <span className="mate-game__radio" aria-hidden="true"/>
                                <span className="mate-game__text">
                                    {/* '10.22 (목) · LG vs 두산' */}
                                    <span className="mate-game__main">{formatDay(game.gameAt)} · {matchLabel(game, myTeam)}</span>
                                    {/* '잠실야구장 · 18:30' */}
                                    <span className="mate-game__sub">{game.stadium} · {formatTime(game.gameAt)}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </BottomSheet>
    )
}

export default MateGameSheet
