import {MOCK_MY_MEETUP} from '../constants/mate.js'

// 홈 "내 다음 직관" 카드는 아직 참여/수락 DB가 없어서 로컬 더미를 쓴다.
// 참여 신청/수락 기능이 생기면 이 두 함수만 Supabase 조회/변경으로 바꾸면 된다.

const LOCAL_CHECKLIST_KEY = 'dugout.mockMeetupChecklist.v1'

function readLocalChecklists() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_CHECKLIST_KEY)) ?? {}
    } catch {
        return {}
    }
}

/** 홈 화면 "내 다음 직관" 카드 · 내가 만들었거나 참여 확정된 모임 1개 (더미) */
export async function fetchMyNextMeetup(userId) {
    if (!userId) return null
    const checklists = readLocalChecklists()
    return {...MOCK_MY_MEETUP, checklist: checklists[MOCK_MY_MEETUP.id] ?? MOCK_MY_MEETUP.checklist}
}

export async function updateMeetupChecklist(meetupId, checklist) {
    const checklists = readLocalChecklists()
    checklists[meetupId] = checklist
    localStorage.setItem(LOCAL_CHECKLIST_KEY, JSON.stringify(checklists))
}
