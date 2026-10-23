import {useEffect, useState} from 'react'
import {getMyTeam, getSelectableGames} from '../../../api/mate.js'
import {BottomSheet, Button} from '../../../components'
import {formatDay, formatTime, matchLabel} from '../utils/mateFormat.js'
import './MateGameSheet.css'

/**
 * 경기 선택 시트 · 글쓰기의 "같이 볼 경기를 골라 주세요"를 누르면 열린다
 * 디자인 파일이 없어서 직관 기록하기(Record-write.dc.html)의 "다녀온 경기" 목록 모양을 따랐다.
 * 경기 하나를 누르면 바로 고르고 시트가 닫힌다.
 *
 * 🔌 DB: getSelectableGames() · getMyTeam() (DB 담당자가 만든 src/api/mate.js)
 *        시작 전 예정 경기를 빠른 순으로 · 내 팀 경기만 오는 것은 DB 규칙(RLS)이 맡는다
 *        [프론트 이중 확인] DB 규칙이 빠지거나 잘못돼도 다른 팀 경기가 보이지 않도록
 *        화면에서도 내 팀 코드로 한 번 더 거른다 (실제로 DB 규칙이 빠져 다른 팀 경기가 보인 적이 있다)
 * @param {{myTeam: string | null, selectedId: number | null, onPick: (game: object) => void, onClose: () => void}} props
 */
function MateGameSheet({myTeam, selectedId, onPick, onClose}) {
    // status: loading(불러오는 중) | ready | error
    const [state, setState] = useState({status: 'loading', games: []})
    const [retry, setRetry] = useState(0) // "다시 시도"를 누를 때마다 올려서 다시 불러온다

    useEffect(() => {
        let stale = false // 시트를 닫은 뒤 응답이 오면 무시
        // 경기 목록과 내 팀을 동시에 불러온다 (내 팀을 알아야 거를 수 있다)
        // 글쓰기 화면이 내 팀을 아직 못 불러왔을 수 있어서 시트가 직접 한 번 더 확인한다
        Promise.all([getSelectableGames(), getMyTeam()])
            .then(([games, team]) => {
                if (stale) return
                // 내 팀이 홈이거나 원정인 경기만 남긴다
                const mine = games.filter((game) => game.home === team || game.away === team)
                setState({status: 'ready', games: mine})
            })
            .catch(() => !stale && setState({status: 'error', games: []}))
        return () => {
            stale = true
        }
    }, [retry])

    const reload = () => {
        setState({status: 'loading', games: []})
        setRetry((n) => n + 1)
    }

    return (
        // 기존 BottomSheet: 딤 배경 · Esc · 배경 눌러 닫기 · 맨 아래 "닫기" 버튼까지 그려 준다
        <BottomSheet open onClose={onClose} label="경기 선택">
            <div className="mate-game">
                <h2 className="mate-game__title">경기 선택</h2>
                <p className="mate-game__desc">아직 시작하지 않은 우리 팀 경기예요</p>

                {state.status === 'loading' && <p className="mate-game__state">경기 일정을 불러오고 있어요</p>}

                {state.status === 'error' && (
                    <div className="mate-game__state">
                        경기 일정을 불러오지 못했어요
                        <Button variant="small-outline" onClick={reload}>다시 시도</Button>
                    </div>
                )}

                {state.status === 'ready' && state.games.length === 0 && (
                    <p className="mate-game__state">앞으로 열릴 경기가 없어요</p>
                )}

                {/* 경기 목록 · 하나만 고르는 목록이라 radiogroup + radio */}
                {state.status === 'ready' && state.games.length > 0 && (
                    <div role="radiogroup" aria-label="같이 볼 경기" className="mate-game__list">
                        {state.games.map((game) => (
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
