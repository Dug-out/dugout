-- AI 직관 플래너 · 더미 데이터 스키마 (초안)
-- KBO 공식 API가 없어서 크롤링 대신, 경기·투수·날씨·좌석 정보를 직접 채워 넣고 쓴다.
-- 팀 검토 후 확정되면 supabase/schema.sql로 옮겨 합친다. 더미 행은 대시보드(SQL Editor)에서 직접 넣는다.
-- 표 이름은 games가 아니라 ai_games다 — 직관 기록 기능용으로 팀원이 이미 만들어 둔
-- public.games(컬럼: game_at 등)와 이름이 겹쳐서, 그 표는 그대로 두고 이 표만 구분했다.

-- ─────────────────────────────────────────────
-- 1. 구장 (더미) · 경기장별 교통 안내
--    실제로는 사용자 출발 지역에 따라 달라져야 하지만, profiles에 출발 지역이 없어
--    지금은 구장 기준 고정값만 둔다 (나중에 프로필에 출발지 추가되면 개인화).
-- ─────────────────────────────────────────────
create table public.stadiums (
  code text primary key,              -- 'JAMSIL'
  name text not null,                 -- '잠실야구장'
  transit_minutes int not null,       -- 40
  transit_line text not null          -- '2호선 종합운동장역'
);

-- ─────────────────────────────────────────────
-- 2. 경기 일정 (더미) · 선발 투수 · AI 예상 승률 포함
--    home_win_pct는 홈팀 기준 승률(%). 원정팀 입장 승률은 100 - home_win_pct로 계산해서 보여준다.
--    "추천 92점" 같은 랭킹 점수는 저장하지 않는다 — 사용자가 고른 조건(날짜·좌석·예산 등)에 맞춰
--    매번 다르므로 Edge Function이 이 표를 읽어서 그때그때 계산한다.
-- ─────────────────────────────────────────────
create table public.ai_games (
  id uuid primary key default gen_random_uuid(),
  game_date date not null,
  start_time time not null,
  home_team text not null check (home_team in ('LG','두산','KIA','삼성','롯데','한화','SSG','NC','KT','키움')),
  away_team text not null check (away_team in ('LG','두산','KIA','삼성','롯데','한화','SSG','NC','KT','키움')),
  stadium_code text not null references public.stadiums (code),
  home_pitcher_name text,
  home_pitcher_era numeric(4,2),
  away_pitcher_name text,
  away_pitcher_era numeric(4,2),
  pitcher_status text not null default '예상' check (pitcher_status in ('확정','예상')),
  home_win_pct int check (home_win_pct between 0 and 100),
  weather_desc text,                  -- '맑음'
  weather_temp int,                   -- 18
  rain_chance int check (rain_chance between 0 and 100),
  created_at timestamptz not null default now(),
  unique (game_date, home_team, away_team)
);

-- ─────────────────────────────────────────────
-- 3. 경기별 좌석/가격 (더미) · 구역 단위 잔여석
--    seat_type은 모집 글 좌석 종류(MATE_POST.SEATS)와 맞춰서, 나중에 메이트 모집 글과 매칭할 때 쓴다.
-- ─────────────────────────────────────────────
create table public.game_seats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.ai_games (id) on delete cascade,
  zone text not null,                 -- '1루 응원석' · 화면에 보여줄 구역 이름
  seat_type text not null check (seat_type in ('응원석','테이블석','내야석','외야석')),
  price int not null,                 -- 1인 예상 비용(티켓+먹거리 기준), 원
  total_count int not null,
  remaining_count int not null check (remaining_count between 0 and total_count),
  note text                           -- '2연석 가능'
);

alter table public.stadiums enable row level security;
alter table public.ai_games enable row level security;
alter table public.game_seats enable row level security;

create policy "stadiums_select_authenticated" on public.stadiums
  for select to authenticated using (true);
create policy "ai_games_select_authenticated" on public.ai_games
  for select to authenticated using (true);
create policy "game_seats_select_authenticated" on public.game_seats
  for select to authenticated using (true);

-- 더미 데이터는 대시보드(service role)에서만 채운다 — 클라이언트는 쓰기 권한 없음
revoke insert, update, delete on public.stadiums from anon, authenticated;
revoke insert, update, delete on public.ai_games from anon, authenticated;
revoke insert, update, delete on public.game_seats from anon, authenticated;

-- ─────────────────────────────────────────────
-- 4. 내가 저장한 AI 플랜 (실데이터) · 홈 "내 다음 직관" 카드 · 직관 준비 체크리스트
--    seat_zone·budget_tier는 저장 시점 스냅샷(이후 game_seats 잔여석이 바뀌어도 안 변함).
-- ─────────────────────────────────────────────
create table public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.ai_games (id) on delete cascade,
  companion_type text not null check (companion_type in ('혼자','친구랑','메이트 구해요')),
  seat_zone text not null,
  budget_tier text not null check (budget_tier in ('2만원 이하','4만원 이하','상관없음')),
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
-- 5. 더미 데이터 예시 (모형 화면 기준 · LG 팬)
-- ─────────────────────────────────────────────
insert into public.stadiums (code, name, transit_minutes, transit_line) values
  ('JAMSIL', '잠실야구장', 40, '2호선 종합운동장역'),
  ('SUWON', '수원 KT위즈파크', 65, '분당선 수원시청역');

insert into public.ai_games
  (game_date, start_time, home_team, away_team, stadium_code,
   home_pitcher_name, home_pitcher_era, away_pitcher_name, away_pitcher_era,
   pitcher_status, home_win_pct, weather_desc, weather_temp, rain_chance)
values
  ('2026-10-22', '18:30', 'LG', '두산', 'JAMSIL', '임찬규', 3.12, '곽빈', 3.45, '확정', 58, '맑음', 18, 10),
  ('2026-10-23', '18:30', 'KT', 'LG', 'SUWON', '엄상백', 3.80, '케이시 켈리', 3.20, '예상', 45, '흐림', 16, 30),
  ('2026-10-24', '18:30', 'KT', 'LG', 'SUWON', '고영표', 3.55, '임찬규', 3.12, '예상', 48, '맑음', 15, 10),
  ('2026-10-25', '17:00', 'KT', 'LG', 'SUWON', '웨스 벤자민', 3.40, '최원태', 3.90, '예상', 40, '맑음', 14, 0);

insert into public.game_seats (game_id, zone, seat_type, price, total_count, remaining_count, note)
select id, '1루 응원석', '응원석', 38000, 40, 6, '2연석 가능' from public.ai_games where game_date = '2026-10-22'
union all
select id, '테이블석', '테이블석', 55000, 20, 3, null from public.ai_games where game_date = '2026-10-22'
union all
select id, '외야석', '외야석', 25000, 60, 22, null from public.ai_games where game_date = '2026-10-23'
union all
select id, '내야석', '내야석', 45000, 30, 5, null from public.ai_games where game_date = '2026-10-23'
union all
select id, '3루 응원석', '응원석', 36000, 40, 15, '2연석 가능' from public.ai_games where game_date = '2026-10-24'
union all
select id, '내야석', '내야석', 42000, 25, 2, null from public.ai_games where game_date = '2026-10-24'
union all
select id, '1루 응원석', '응원석', 36000, 40, 1, '거의 매진' from public.ai_games where game_date = '2026-10-25'
union all
select id, '테이블석', '테이블석', 58000, 15, 0, null from public.ai_games where game_date = '2026-10-25';
