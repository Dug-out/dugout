-- 경기 일정 (실행 순서: 01 다음 · profiles 가 있어야 한다)
------------------------------------------
-- 2.경기 · 모집 글에서 "같이 볼 경기"로 고르는 목록
------------------------------------------
create table public.games (
  id bigint generated always as identity primary key,
  home_team text not null check (home_team in ('LG','두산','KIA','삼성','롯데','한화','SSG','NC','KT','키움')),
  away_team text not null check (away_team in ('LG','두산','KIA','삼성','롯데','한화','SSG','NC','KT','키움')),
  stadium text not null,
  home_score int,
  away_score int,
  game_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','finished','canceled')),
  check (home_team <> away_team),
  check (status <> 'finished' or (home_score is not null and away_score is not null)),
  check (home_score >= 0 and away_score >= 0)
);

-- 행 단위 접근 규칙(RLS) 켜기: 아래 정책이 허용한 요청만 통과
alter table public.games enable row level security;

-- 조회: 내 응원팀이 뛰는 경기(홈 또는 원정)만 볼 수 있다
create policy "games_select_my_team" on public.games
  for select to authenticated
  using (
    home_team = (select team from public.profiles where id = auth.uid())
    or away_team = (select team from public.profiles where id = auth.uid())
  );

-- 로그인 안 한 사람(anon)과 로그인한 사람 모두의 기본 권한을 회수
revoke all on public.games from anon, authenticated;

-- 로그인한 사람은 조회만 가능 (추가 · 수정은 대시보드에서만)
grant select on public.games to authenticated;
