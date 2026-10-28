# 덕아웃 디자인 원본 (간소화 버전)

Claude Design 캔버스의 "간소화 버전" 페이지를 그대로 내보낸 폴더예요. 개발할 때 **참고용 원본**으로만 쓰고, 이 파일을 그대로 앱에 넣지는 않아요.

- `screens/*.dc.html` — 화면 하나당 파일 하나 (390px 모바일 기준). 캔버스의 `Lite-` 접두어는 뺐어요.
- `assets/*.png`, `*.svg` — 앱에서 실제로 쓰는 이미지만 담았어요 (`public/assets`로 복사).
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

### 홈 · AI 플랜
- `Home.dc.html` — 홈 (로고 · 알림 / 제목 / AI 직관 플래너: 언제 · 좌석 · 선호 음식 칩 / 승부 예측 배너)
- `Plan.dc.html` — 출발 위치 고르기 (고른 조건 칩 · 지도 + 가운데 핀 · 주소 검색 · 현재 위치 · "이 위치에서 플랜 짜기"). 상태 `initialState`: map / loading
- `Plan-loading.dc.html` — 플랜 짜는 중 (마스코트 · 진행 막대) ← `Plan` 래퍼
- `Planner-Result.dc.html` — AI 직관 플랜 결과 (고른 조건 줄 · 추천 경기 카드 · AI 경기 포인트 말풍선 · 나의 직관 플랜 4단계: 티켓 예매 → 출발(이동 경로) → 구장 도착·구장 안 맛집 → 경기 관람 · 같은 좌석 직관 모임 · 모임 만들기 버튼)

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
- `Mate-manage.dc.html` — 신청자 관리 (수락 · 거절, 하단 버튼은 모집 글 수정하기만)
- `Mate-chat-host.dc.html` — 채팅방 (방장, 상태: chat / menu / delete / closed)
- `Mate-chat-host-menu.dc.html` — 방장 메뉴 (모집 글 수정 · 모임 삭제) ← 래퍼
- `Mate-chat-host-closed.dc.html` — 모집 마감 후 (인원이 다 차서 자동 마감) ← 래퍼
- `Mate-chat-host-delete.dc.html` — 모임 삭제 확인 ← 래퍼

### 승부 예측 (홈 배너에서 진입 · 탭바 없음)
- `Predict.dc.html` — 예측하기 (경기 카드 · 마감 칩 · 상대 전적 / 스코어 카드: AI 한 줄 브리핑 띠 + 두 팀 점수 + 결과 배지 / LG팬 예측 비율 + 가장 많이 예측한 스코어). 상태 `initialState`: open / done
- `Predict-done.dc.html` — 예측 완료 (아래 "예측 수정하기") ← `Predict` 래퍼
- `Predict-rank.dc.html` — 랭킹 (월간 / 시즌, 1~3위 단상 + 목록 + 내 순위 고정)
- `Predict-history.dc.html` — 내 기록 (월간 · 시즌 누적 점수와 랭킹 + 예측 내역)
- `Predict-result.dc.html` — 예측 결과 · 점수 획득 (상태 `variant`: hit / miss)
- `Predict-miss.dc.html` — 예측 결과 · 빗나감 ← `Predict-result` 래퍼

### 내 직관 (탭)
- `My-posts.dc.html` — 내 직관 (전체 · 내가 연 약속 · 참여한 약속). 카드는 메이트 찾기 목록과 같은 큰 이미지 카드 + 상태 칩(방장 · 참여 중 · 종료). 수락 대기 중인 신청은 보여주지 않음 (수락된 약속만)

### 마이페이지 · 평가 · 프로필
- `My.dc.html` — 마이페이지 (매너 타율 카드 → 받은 매너 후기 · 메이트 평가하기 · 내 예측 기록 · 계정)
- `Profile-edit.dc.html` — 프로필 수정 (닉네임 · 한 줄 소개 · 자기소개 · 나이대 · 성별 · 응원팀)
- `Review-list.dc.html` — 메이트 평가하기 (평가 대기 · 지난 평가)
- `Review.dc.html` — 메이트 평가 (만남 확인 · 점수 슬라이더 · 한 줄 후기 · 노쇼)
- `Review-done.dc.html` — 평가 완료
- `Manner.dc.html` — 받은 매너 후기 (점수 + 한 줄 후기, 작성자 비공개)
- `Profile-view.dc.html` — 메이트 프로필 (다른 사람이 볼 때 · 후기 3개)
- `Profile-reviews.dc.html` — 메이트 프로필 · 매너 후기 전체보기

### 빈 화면
- `Empty-mate.dc.html` — 메이트 찾기 · 모집 글 없음
- `Empty-predict.dc.html` — 승부 예측 · 예측할 경기 없음
- `Empty-posts.dc.html` — 내 직관 · 약속 없음
- `Empty-review.dc.html` — 메이트 평가 · 평가 대기 없음 (`Review-list` 카드 구조 그대로, 카드 안에 빈 안내)
- `Empty-manner.dc.html` — 받은 매너 후기 · 후기 없음 (`Manner` 카드 구조 그대로, 카드 안에 빈 안내)

### 로딩
- `Loading.dc.html` — 로딩 중 (마스코트 흔들림 + 점 3개 깜빡임). 데이터 불러올 때 화면 가운데에 공통으로 사용

## 화면 이동 (주요 흐름)
- `Splash` → `Login` ↔ `Signup` → `Signup-done` → `Profile-edit` 또는 `Home`
- `Mate` → `Mate-detail` → 신청 → (방장 수락) → `Mate-chat`
- `Home` 플래너 → `Plan`(출발 위치) → 로딩 → `Planner-Result` / `Home` 승부 예측 배너 → `Predict` ↔ `Predict-rank` ↔ `Predict-history`, 경기 끝나면 → `Predict-result`
- `Mate` FAB → `Mate-write` → `Mate-detail`(내 글) / 내 직관 탭 `My-posts` → `Mate-manage` → `Mate-chat-host`
- 채팅방·상세·신청자 관리의 프로필 사진 → `Profile-view` → `Profile-reviews`
- `My` → 매너 타율 카드 → `Manner` / 메이트 평가하기 → `Review-list` → `Review` → `Review-done` / 내 예측 기록 → `Predict-history`
- 탭바: 홈 `Home` · 플랜 `Plan` · 메이트 찾기 `Mate` · 내 직관 `My-posts` · 마이 `My`

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
| `rate-up.png` / `rate-down.png` | 승부 예측 결과 점수 획득 / 0점 · 홈 승부 예측 배너(`rate-up`) |
| `planner-chat.png` | 홈 AI 직관 플래너 카드 · 플랜 로딩 마스코트 (`planner-pose.svg`는 더 안 씀) |
| `rate-good.png` / `rate-soso.png` / `rate-bad.png` | 메이트 평가 점수 8↑ / 5~7 / 4↓ |
| `rate-noshow.png` | 메이트 평가 · 노쇼로 평가했을 때 |
| `loading.png` | 로딩 상태 (흔들림 + 통통 모션, 점 3개 깜빡임) |
| `team-lg.png` … `team-kiwoom.png` | 응원팀 아이콘 10개 (회원가입 · 프로필 수정 · 승부 예측 경기 카드). 파일 이름은 `policy.js`의 `TEAMS[].icon` |
| `mate-default.png` | 모집 글 기본 이미지 (목록 카드 · 상세 · 썸네일 공통, 1200×680) |
| `mate-photo-sample.png` | 디자인 예시용 (사진 올렸을 때 미리보기). 앱에는 넣지 않아도 돼요 |
