-- AI 직관 플래너 · 구장 참고 정보 + 저장한 플랜
-- 경기 일정은 더미(ai_games)를 따로 만들지 않고 팀원이 이미 만든 public.games(직관 기록 기능용)를
-- 그대로 쓴다 — games.stadium은 코드가 아니라 짧은 이름 텍스트라, 코드 매핑은
-- src/constants/planner.js STADIUM_CODE_BY_NAME에서 한다. 좌석(응원석/테이블석/내야석/외야석)은
-- games에 잔여석 데이터가 없어서 추천·매칭용 DB 조회는 없고, 화면·Gemini 문구에만 쓰는 사용자 선호값이다.
-- 날씨·대기질은 Open-Meteo, 구장 맛집은 카카오 로컬 API로 실데이터를 그때그때 가져온다 (이 표에는 안 담음).

-- ─────────────────────────────────────────────
-- 1. 구장 · 경기장별 교통 안내 (stadium_food.stadium_code가 참조하는 FK 대상)
--    실제로는 사용자 출발 지역에 따라 달라져야 하지만, profiles에 출발 지역이 없어
--    지금은 구장 기준 고정값만 둔다 (나중에 프로필에 출발지 추가되면 개인화).
-- ─────────────────────────────────────────────
create table public.stadiums (
  code text primary key,              -- 'JAMSIL'
  name text not null,                 -- '잠실야구장'
  transit_minutes int not null,       -- 40 (출발지를 모르니 화면엔 안 씀 — 나중에 프로필에 출발지 생기면 길찾기 API로 교체)
  transit_line text not null,         -- '2호선 종합운동장역' — "가는 길"엔 이 가까운 역만 보여준다
  lat numeric(9,6),                   -- 날씨·대기질 API(Open-Meteo), 맛집(카카오 로컬 API) 조회용 위도
  lng numeric(9,6)                    -- 위와 같은 용도의 경도
);

alter table public.stadiums enable row level security;
create policy "stadiums_select_authenticated" on public.stadiums
  for select to authenticated using (true);
revoke insert, update, delete on public.stadiums from anon, authenticated;

-- ─────────────────────────────────────────────
-- 2. 내가 저장한 AI 플랜 · 홈 "내 다음 직관" 카드 · 직관 준비 체크리스트
--    game_id는 public.games(id, bigint) 참조. seat_zone은 추천 좌석이 아니라 저장 시점에
--    고른 좌석 "조건"(예: '응원석') 텍스트 스냅샷이다.
-- ─────────────────────────────────────────────
create table public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id bigint not null references public.games (id) on delete cascade,
  companion_type text not null check (companion_type in ('메이트 구해요','친구랑','데이트','혼자')),
  seat_zone text not null,
  checklist jsonb not null default '{"ticket":false,"mate":false,"food":false,"transit":false}',
  created_at timestamptz not null default now()
);

alter table public.saved_plans enable row level security;

create policy "saved_plans_select_own" on public.saved_plans
  for select to authenticated using (auth.uid() = user_id);
create policy "saved_plans_insert_own" on public.saved_plans
  for insert to authenticated with check (auth.uid() = user_id);
create policy "saved_plans_update_own" on public.saved_plans
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved_plans_delete_own" on public.saved_plans
  for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 3. 구장 10곳 좌표 · 교통 (더미 데이터 예시)
-- ─────────────────────────────────────────────
insert into public.stadiums (code, name, transit_minutes, transit_line, lat, lng) values
  ('JAMSIL', '잠실야구장', 40, '2호선 종합운동장역', 37.512150, 127.071976),
  ('SUWON', '수원 KT위즈파크', 65, '분당선 수원시청역', 37.299759, 127.009781),
  ('GOCHEOK', '고척스카이돔', 0, 'TODO', 37.498333, 126.866667), -- 키움
  ('INCHEON', '인천 SSG랜더스필드', 0, 'TODO', 37.435139, 126.690806), -- SSG
  ('DAEJEON', '대전 한화생명볼파크', 0, 'TODO', 36.317000, 127.389100), -- 한화
  ('DAEGU', '대구 삼성라이온즈파크', 0, 'TODO', 35.841110, 128.681670), -- 삼성
  ('GWANGJU', '광주 기아챔피언스필드', 0, 'TODO', 35.168339, 126.888992), -- KIA
  ('CHANGWON', '창원NC파크', 0, 'TODO', 35.222500, 128.582200), -- NC
  ('BUSAN', '부산 사직야구장', 0, 'TODO', 35.194077, 129.061584); -- 롯데
