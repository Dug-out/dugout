import {formatMonthDay, scoreText, teamOf} from '../../../utils/predict.js'
import './HistoryRow.css'

// 상태별 배지 글자 (화면 읽기용) · wait 경기 전 / miss 빗나감 / hit 승부 적중 / exact 스코어 적중
const STATE_LABEL = {wait: '경기 전', miss: '빗나감', hit: '승부 적중', exact: '스코어 적중'}

/**
 * 예측 내역 한 줄 · 날짜 · 상대, 내 예측 · 결과, 점수 배지
 * @param {{pick: {gameAt: string, opponent: string, pick: {my: number, opp: number},
 *          result: null | {my: number, opp: number}, points: number | null, state: 'wait' | 'miss' | 'hit' | 'exact'}}} props
 */
function HistoryRow({pick}) {
    const {gameAt, opponent, result, points, state} = pick
    const pointText = state === 'wait' ? '' : points > 0 ? `+${points}` : '0'

    return (
        <li className="history-row">
            <span className="history-row__game">
                <span className="history-row__date">{formatMonthDay(gameAt)}</span>
                <span className="history-row__opp">vs {teamOf(opponent).label}</span>
            </span>

            <span className="history-row__scores">
                <span>
                    <span className="history-row__key">예측</span> <strong>{scoreText(pick.pick)}</strong>
                </span>
                <span>
                    <span className="history-row__key">결과</span>{' '}
                    <span className="history-row__real">{result ? scoreText(result) : '경기 전'}</span>
                </span>
            </span>

            <span className={`history-row__badge history-row__badge--${state}`}>
                <BadgeIcon state={state} />
                <span aria-label={`${STATE_LABEL[state]} ${pointText}`.trim()}>{pointText}</span>
            </span>
        </li>
    )
}

/** 배지 아이콘 · 스코어 적중 과녁 / 승부 적중 체크 / 경기 전 시계 / 빗나감은 없음 */
function BadgeIcon({state}) {
    if (state === 'exact') {
        return (
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
        )
    }
    if (state === 'hit') {
        return (
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
        )
    }
    if (state === 'wait') {
        return (
            <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
            >
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2.5 2" />
            </svg>
        )
    }
    return null
}

export default HistoryRow
