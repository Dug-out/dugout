// 승부 예측 AI 브리핑 띠 글자 · 조사(이/가, 으로/로)를 자동으로 맞춘다
import {outcomeOf} from './predict.js'

/** 띠 상태 문구 · 불러오는 중 / 실패 */
export const BRIEFING_LOADING = 'AI가 브리핑을 준비하고 있어요…'
export const BRIEFING_FAILED = '브리핑을 불러오지 못했어요'

// 한글 마지막 글자에 받침이 있는지 · 영어 팀 이름(LG · KIA · SSG · NC · KT)은 읽는 소리가 모두 받침 없이 끝난다
const endsWithBatchim = (word) => {
    const code = word.charCodeAt(word.length - 1) - 0xac00
    return code >= 0 && code <= 11171 && code % 28 !== 0
}

/** 팀 이름 + 이/가 · '두산이', 'LG가' */
const withSubject = (team) => `${team}${endsWithBatchim(team) ? '이' : '가'}`

/** 점수 + 으로/로 · 읽는 소리 기준 (0 영 · 3 삼 · 6 육 · 10 십 은 받침 있음, 1 일 · 7 칠 · 8 팔 은 ㄹ 받침이라 '로') */
const withDirection = (score) => `${score}${score % 10 === 0 || score % 10 === 3 || score % 10 === 6 ? '으로' : '로'}`

/**
 * AI 예상 스코어 문장 · 내 팀 기준
 *  '나는 LG가 4 : 3으로 이길 거라고 생각해^^' / '나는 3 : 3 무승부일 거라고 생각해^^' / '나는 LG가 2 : 4로 질 거라고 생각해^^'
 */
export const pickSentence = (my, opp, teamLabel) => {
    const outcome = outcomeOf(my, opp)
    if (outcome === 'draw') return `나는 ${my} : ${opp} 무승부일 거라고 생각해^^`
    return `나는 ${withSubject(teamLabel)} ${my} : ${withDirection(opp)} ${outcome === 'win' ? '이길' : '질'} 거라고 생각해^^`
}

/** 띠 전체 문구 · '(한 줄 브리핑) · 나는 LG가 4 : 3으로 이길 거라고 생각해^^' */
export const briefingText = ({briefing, my, opp}, teamLabel) => `${briefing} · ${pickSentence(my, opp, teamLabel)}`
