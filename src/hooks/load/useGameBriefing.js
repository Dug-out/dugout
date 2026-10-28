import {getMyUserId, getTodayGameId, requestBriefing} from '../../api/briefing.js'
import useLoad from '../useLoad.js'

// 브라우저에 저장하는 이름표 · 사용자 + 경기마다 따로
const keyOf = (userId, gameId) => `predict-briefing:${userId}:${gameId}`

// 같은 이름표로 동시에 두 번 부르지 않게 (화면이 빠르게 두 번 그려져도 Claude 는 한 번만)
const pending = new Map()

/** 저장된 브리핑 꺼내기 · 없거나 모양이 다르면 null (저장소를 못 쓰는 환경도 null) */
function readSaved(key) {
    try {
        const saved = JSON.parse(localStorage.getItem(key))
        return typeof saved?.briefing === 'string' && Number.isInteger(saved.my) && Number.isInteger(saved.opp)
            ? saved
            : null
    } catch {
        return null
    }
}

function save(key, briefing) {
    try {
        localStorage.setItem(key, JSON.stringify(briefing))
    } catch {
        // 저장소를 못 쓰면 이번 화면에만 보여 준다
    }
}

/** 처음이면 서버 함수로 받아 저장하고, 이미 받았으면 저장된 것을 그대로 (고정) */
async function loadBriefing(nextGameId) {
    const [userId, todayGameId] = await Promise.all([getMyUserId(), getTodayGameId()])
    // 오늘 경기가 있으면 0~24시 동안 오늘 경기, 없으면 화면의 다음 경기
    const key = keyOf(userId, todayGameId ?? nextGameId)

    const saved = readSaved(key)
    if (saved) return saved

    if (!pending.has(key)) {
        const request = requestBriefing(todayGameId ?? nextGameId)
            .then((briefing) => {
                save(key, briefing)
                return briefing
            })
            .finally(() => pending.delete(key))
        pending.set(key, request)
    }
    return pending.get(key)
}

/**
 * 승부 예측 AI 브리핑 · 오늘 경기가 있으면 오늘 경기, 없으면 다음 경기의 한 줄 브리핑과 예상 스코어
 * @param {number} nextGameId 예측하기 화면의 경기 (오늘 경기가 없을 때 쓴다)
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', briefing: {briefing: string, my: number, opp: number} | null}}
 */
export default function useGameBriefing(nextGameId) {
    const {status, data: briefing} = useLoad(() => loadBriefing(nextGameId), [nextGameId])
    return {status, briefing}
}
