// 덕아웃 간소화 버전 정책 숫자 — CLAUDE.md "정책 숫자"와 같은 내용

export const MANNER = {
    START: 0.25,
    MIN: 0.2,
    MAX: 0.4,
    NOSHOW_DELTA: -0.015,
    // 점수(1~10) → 매너 타율 변화량
    deltaFromScore: (score) => (score - 6) * 0.002,
    TIERS: [
        {min: 0.4, label: '4할 타자'},
        {min: 0.3, label: '3할 타자'},
        {min: 0.25, label: '주전 타자'},
        {min: 0, label: '슬럼프'},
    ],
}

export const REVIEW = {
    SCORE_MIN: 1,
    SCORE_MAX: 10,
    DEADLINE_DAYS: 7, // 경기 후 7일 안에만 평가
    SAME_PERSON_PER_MONTH: 1, // 같은 사람끼리 한 달 1회만 반영
    COMMENT_MAX: 100,
    PROFILE_PREVIEW_COUNT: 3, // 프로필에는 최근 3개 + 전체보기
    // 점수 → 표정 이미지
    faceFromScore: (s) => (s >= 8 ? 'rate-good' : s >= 5 ? 'rate-soso' : 'rate-bad'),
}

export const RECORD = {
    MEMO_MAX: 100,
    // 직관 승률 .500 기준으로 캐릭터 2종
    mood: (rate) =>
        rate >= 0.5
            ? {name: '승리요정', image: 'rate-up', line: '내가 가면 이긴다! 오늘도 출격'}
            : {name: '눈물요정', image: 'rate-down', line: '다음 직관은 꼭 이길 거야…'},
}

export const PROFILE = {
    DEFAULT_AVATAR: '/assets/profile-default.png', // 프로필 사진이 없을 때
}

export const MATE_POST = {
    MEMBERS_MIN: 2, // 본인 포함
    MEMBERS_MAX: 10,
    TITLE_MAX: 50,
    DESCRIPTION_MAX: 500,
    SEATS: ['응원석', '테이블석', '내야석', '외야석'], // 하나만
    AGES: ['10대', '20대', '30대', '40대 이상'], // 여러 개, 선택 안 하면 무관
    GENDERS: ['여성', '남성', '무관'], // 하나만
    APPLY_MESSAGE_MAX: 100,
    DEFAULT_IMAGE: '/assets/mate-default.png',
    IMAGE_WIDTH: 1200, // 대표 이미지 크기 · 기본 이미지(mate-default.png)와 같은 비율
    IMAGE_HEIGHT: 680,
}

export const SIGNUP = {
    EMAIL_RULE: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NICKNAME_MIN: 2,
    NICKNAME_MAX: 10,
    PASSWORD_RULE: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/, // 영문 + 숫자 8자 이상
    GENDERS: ['여성', '남성'],
    AGES: ['10대', '20대', '30대', '40대 이상'],
    // 화면 표시는 짧은 이름, 저장은 code. 선택하면 테두리 · 글자가 color로 바뀜
    TEAMS: [
        {code: 'LG', label: 'LG', name: 'LG 트윈스', icon: '/assets/team-lg.png', color: '#C30452'},
        {code: '두산', label: '두산', name: '두산 베어스', icon: '/assets/team-doosan.png', color: '#131230'},
        {code: 'KIA', label: 'KIA', name: 'KIA 타이거즈', icon: '/assets/team-kia.png', color: '#EA0029'},
        {code: '삼성', label: '삼성', name: '삼성 라이온즈', icon: '/assets/team-samsung.png', color: '#0066B3'},
        {code: '롯데', label: '롯데', name: '롯데 자이언츠', icon: '/assets/team-lotte.png', color: '#042445'},
        {code: '한화', label: '한화', name: '한화 이글스', icon: '/assets/team-hanwha.png', color: '#FC4E00'},
        {code: 'SSG', label: 'SSG', name: 'SSG 랜더스', icon: '/assets/team-ssg.png', color: '#CE0E2D'},
        {code: 'NC', label: 'NC', name: 'NC 다이노스', icon: '/assets/team-nc.png', color: '#1D467D'},
        {code: 'KT', label: 'KT', name: 'KT 위즈', icon: '/assets/team-kt.png', color: '#000000'},
        {code: '키움', label: '키움', name: '키움 히어로즈', icon: '/assets/team-kiwoom.png', color: '#820024'},
    ],
}
