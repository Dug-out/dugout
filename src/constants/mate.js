// 메이트 찾기 · 직관 모임 더미. 실제 모집 글 · 참여 신청/수락 기능이 생기기 전까지 쓴다.
// 실제 기능이 생기면 src/api/mate.js 쪽 함수들을 Supabase 조회로 바꾸면 된다.

export const MOCK_MATE_POSTS = [
    {
        id: 'm1',
        gameDate: '2026-10-22',
        title: '목요일 퇴근 직관 같이 가요!',
        place: 'LG vs 두산 · 1루 응원석',
        matchup: 'LG vs 두산',
        seatType: '1루 응원석',
        ageGroups: ['20대', '30대'],
        gender: '무관',
        joined: 2,
        capacity: 4,
        matchPct: 92,
        host: '직관요정',
        manner: 0.389,
        description: '목요일 두산전, 퇴근하고 바로 잠실로 출발해요. 같이 응원하면서 치맥할 메이트 구해요. 만나는 시간과 장소는 수락 후 채팅방에서 정할게요!',
    },
    {
        id: 'm2',
        gameDate: '2026-10-23',
        title: '금요일 수원 원정 같이 가요',
        place: 'LG vs KT · 외야석',
        matchup: 'LG vs KT',
        seatType: '외야석',
        ageGroups: [],
        gender: '무관',
        joined: 4,
        capacity: 5,
        matchPct: 81,
        host: '원정뛰는사람',
        manner: 0.312,
        description: '수원 원정 응원 가실 분 모여요. 외야석에서 편하게 응원해요. 카풀 가능하면 같이 움직여도 좋아요.',
    },
    {
        id: 'm3',
        gameDate: '2026-10-22',
        title: '치맥하면서 편하게 보실 분',
        place: 'LG vs 두산 · 테이블석',
        matchup: 'LG vs 두산',
        seatType: '테이블석',
        ageGroups: ['30대', '40대 이상'],
        gender: '여성',
        joined: 1,
        capacity: 2,
        matchPct: 78,
        host: '잠실치킨러',
        manner: 0.275,
        description: '테이블석에서 치맥하면서 편하게 볼 분 구해요. 조용히 경기 보는 걸 좋아하시는 분이면 좋아요.',
    },
]

// 홈 "내 다음 직관" 카드용 더미 · 내가 만들었거나 참여 확정된 모임 1개.
// id는 위 MOCK_MATE_POSTS의 'm1'과 같다 — "내가 m1의 방장"이라는 뜻. 참여 신청/수락 기능이
// 생기면 실제 로그인 사용자 기준으로 조회한 값으로 바꾼다.
export const MOCK_MY_MEETUP = {
    id: 'm1',
    role: 'host', // 'host' 내가 만든 모임 | 'guest' 참여 확정된 모임
    title: '목요일 퇴근 직관 같이 가요!',
    gameDate: '2026-10-22',
    startTime: '18:30',
    homeTeam: 'LG',
    awayTeam: '두산',
    stadiumName: '잠실야구장',
    seatZone: '1루 응원석',
    joined: 2,
    capacity: 4,
    checklist: {ticket: false, mate: false, food: false, transit: false},
}
