# 덕아웃 디자인 원본 (간소화 버전)

Claude Design 캔버스의 "간소화 버전" 페이지를 그대로 내보낸 폴더예요. 개발할 때 **참고용 원본**으로만 쓰고, 이 파일을 그대로 앱에 넣지는 않아요.

- `screens/*.dc.html` — 화면 하나당 파일 하나 (390px 모바일 기준). 캔버스의 `Lite-` 접두어는 뺐어요.
- `assets/*.png` — 앱에서 실제로 쓰는 이미지만 담았어요 (`public/assets`로 복사).
- `screens/Style-guide.dc.html` — 색, 글꼴, 버튼, 칩, 입력, 카드, 화면 패턴
- `screens/Brand-assets.dc.html` — 이미지 목록과 쓰임새

## 파일 읽는 법
- 일반 HTML + 인라인 스타일이에요. `{{name}}` 자리는 브라우저로 열면 비어 보일 수 있어요.
- `{{name}}` = 데이터 자리, `<sc-if value>` = 조건부 렌더링, `<sc-for list as>` = 목록 반복. React에서는 `{name}`, `{cond && ...}`, `.map()`으로 바꿔요.
- 맨 아래 `<script>`의 `renderVals()`에 샘플 데이터와 상태 로직이 있어요. `data-props`에 화면 상태(예: `initialState`)가 정의돼 있어요.
- `<dc-import name="X" ...>`만 있는 파일은 X 화면의 다른 상태를 보여주는 래퍼예요. 예: `Mate-apply` = `Mate-detail`의 신청 시트 열린 상태.

## 화면 목록

### 가입 · 로그인
- `Splash.dc.html` — 스플래시
- `Login.dc.html` — 로그인 (이메일 + 비밀번호)
- `Signup.dc.html` — 회원가입 한 장 (이메일 중복 확인 · 비밀번호 · 닉네임 · 성별 · 나이대 · 응원팀)
- `Signup-error.dc.html` — 회원가입 오류 상태 (이메일 중복 · 비밀번호 불일치 · 닉네임 중복) ← `Signup` 래퍼
- `Signup-done.dc.html` — 가입 완료 · 멤버 카드 (애니메이션) → 자기소개 작성 / 나중에

### 홈
- `Home.dc.html` — 홈 (아직 디자인 없음, 빈 자리)

### 메이트 찾기 · 모집 글 보기
- `Mate.dc.html` — 모집 글 목록 (같은 팀만 · 날짜 · 모집 중만 · 정렬 · 무한 스크롤)
- `Mate-date.dc.html` — 날짜 선택한 목록 ← `Mate` 래퍼
- `Mate-cal.dc.html` — 날짜 달력 시트 ← `Mate` 래퍼
- `Mate-detail.dc.html` — 모집 글 상세 (상태: before / apply / pending / accepted)

### 메이트 찾기 · 참여
- `Mate-apply.dc.html` — 참여 신청 시트 (한마디) ← `Mate-detail` 래퍼
- `Mate-detail-ok.dc.html` — 참여 확정 · 채팅방 입장 ← `Mate-detail` 래퍼
- `Mate-chat.dc.html` — 모집 채팅방 (참여자)
- `Mate-chat-leave.dc.html` — 채팅방 나가기 확인 ← `Mate-chat` 래퍼

### 메이트 찾기 · 방장
- `Mate-write.dc.html` — 모집 글 쓰기
- `Mate-manage.dc.html` — 신청자 관리 (수락 · 거절)
- `Mate-chat-host.dc.html` — 채팅방 (방장, 상태: chat / menu / delete / closed)
- `Mate-chat-host-menu.dc.html` — 방장 메뉴 ← 래퍼
- `Mate-chat-host-closed.dc.html` — 모집 마감 후 ← 래퍼
- `Mate-chat-host-delete.dc.html` — 모임 삭제 확인 ← 래퍼

### 직관 기록
- `Record.dc.html` — 직관 기록 · 기록 탭 (승률 카드 · 기록 목록)
- `Record-stats.dc.html` — 직관 기록 · 통계 탭 (상대팀별 승률)
- `Record-detail.dc.html` — 직관 기록 상세 (결과 · 메모 · 함께 간 사람)
- `Record-write.dc.html` — 직관 기록하기 (경기 선택 · 결과 자동 · 한 줄 메모)
- `Record-saved.dc.html` — 기록 저장 완료 알림 ← `Record-write` 래퍼

### 마이페이지 · 평가 · 프로필
- `My.dc.html` — 마이페이지 (매너 타율 카드 → 받은 매너 후기)
- `Profile-edit.dc.html` — 프로필 수정 (닉네임 · 한 줄 소개 · 자기소개 · 나이대 · 성별 · 응원팀)
- `My-posts.dc.html` — 내 직관 약속 (전체 · 내가 연 약속 · 참여한 약속)
- `Review-list.dc.html` — 메이트 평가하기 (평가 대기 · 지난 평가)
- `Review.dc.html` — 메이트 평가 (만남 확인 · 점수 슬라이더 · 한 줄 후기 · 노쇼)
- `Review-done.dc.html` — 평가 완료
- `Manner.dc.html` — 받은 매너 후기 (점수 + 한 줄 후기, 작성자 비공개)
- `Profile-view.dc.html` — 메이트 프로필 (다른 사람이 볼 때 · 후기 3개)
- `Profile-reviews.dc.html` — 메이트 프로필 · 매너 후기 전체보기

### 빈 화면
- `Empty-mate.dc.html` — 메이트 찾기 · 모집 글 없음
- `Empty-record.dc.html` — 직관 기록 · 기록 없음
- `Empty-posts.dc.html` — 내 직관 약속 · 약속 없음
- `Empty-review.dc.html` — 메이트 평가 · 평가 대기 없음

### 로딩
- `Loading.dc.html` — 로딩 중 (마스코트 흔들림 + 점 3개 깜빡임). 데이터 불러올 때 화면 가운데에 공통으로 사용

## 화면 이동 (주요 흐름)
- `Splash` → `Login` ↔ `Signup` → `Signup-done` → `Profile-edit` 또는 `Home`
- `Mate` → `Mate-detail` → 신청 → (방장 수락) → `Mate-chat`
- `Mate` FAB → `Mate-write` → `Mate-detail`(내 글) / `My-posts` → `Mate-manage` → `Mate-chat-host`
- 채팅방·상세·신청자 관리의 프로필 사진 → `Profile-view` → `Profile-reviews`
- `My` → 매너 타율 카드 → `Manner` / 내 직관 약속 → `My-posts` / 메이트 평가하기 → `Review-list` → `Review` → `Review-done`
- 탭바의 "거래"(`Trade.dc.html`)는 화면이 없어요.

## 이미지 (`assets/`)
| 파일 | 쓰는 곳 |
|---|---|
| `app-icon.png`, `app-icon-1024.png` | 앱 아이콘 원본 (PWA 아이콘은 `public/`에 사이즈별로 있음) |
| `logo.png`, `logo-1024.png` | 로그인 · 홈 헤더 · 가입 완료 멤버 카드 |
| `logo-base.png`, `logo-flag.png` | 스플래시 로고 애니메이션 |
| `char-peek.png` | 로그인 로고 옆 마스코트 |
| `profile-default.png` | 기본 프로필 사진 (모든 프로필 자리) |
| `pose-hi.png` | 회원가입 인사 |
| `pose-yay.png` | 평가 완료 |
| `pose-sad.png` | 채팅방 나가기 · 모임 삭제 확인 · 노쇼 안내 · 빈 화면 전체 (`Empty-*`) |
| `pose-cheer.png`, `pose-love.png`, `pose-shy.png` | 예비 (스티커 · 신청 대기 등) |
| `rate-up.png` / `rate-down.png` | 직관 승률 .500 이상 / 미만 · 기록 저장 완료 |
| `rate-good.png` / `rate-soso.png` / `rate-bad.png` | 메이트 평가 점수 8↑ / 5~7 / 4↓ |
| `loading.png` | 로딩 상태 (흔들림 + 통통 모션, 점 3개 깜빡임) |
| `team-lg.png` … `team-kiwoom.png` | 응원팀 아이콘 10개 (회원가입 · 프로필 수정). 파일 이름은 `policy.js`의 `TEAMS[].icon` |
| `mate-default.png` | 모집 글 기본 이미지 (목록 카드 · 상세 · 썸네일 공통, 1200×680) |
| `mate-photo-sample.png` | 디자인 예시용 (사진 올렸을 때 미리보기). 앱에는 넣지 않아도 돼요 |
