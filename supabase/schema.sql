------------------------------------------
-- 1. 프로필 · 로그인한 사용자 누구나 조회
------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 10),
  team text not null check (team in ('LG','두산','KIA','삼성','롯데','한화','SSG','NC','KT','키움')),
  gender text not null check (gender in ('여성','남성')),
  age_group text not null check (age_group in ('10대','20대','30대','40대 이상')),
  manner_avg numeric(4,3) not null default 0.250 check (manner_avg between 0.200 and 0.400),
  created_at timestamptz not null default now()  -- 가입 시각 (자동)
);

-- 행 단위 접근 규칙(RLS) 켜기: 아래 정책이 허용한 요청만 통과
alter table public.profiles enable row level security;

-- 조회: 로그인한 사람은 누구나 모든 프로필을 볼 수 있다
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

-- 수정: 로그인한 사람은 내 프로필(id가 내 id인 행)만 고칠 수 있다
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 로그인한 사람은 프로필 조회 가능 (정책과 별개로 테이블 권한도 명시)
grant select on public.profiles to authenticated;

-- 기본으로 열려 있던 추가·수정 권한을 모두 회수 (행 추가는 아래 트리거만 한다)
revoke insert, update on public.profiles from anon, authenticated;

-- 그중 이 네 컬럼의 수정만 다시 허용 (매너 타율은 직접 못 바꿈)
grant update (nickname, team, gender, age_group) on public.profiles to authenticated;

-- 2. 가입 시 프로필 자동 생성
-- 새 계정이 생기면 실행되는 함수
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$  -- 관리자 권한으로 실행
begin
  -- 프로필 행 만들기
  insert into public.profiles (id, nickname, team, gender, age_group)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nickname',
    new.raw_user_meta_data ->> 'team',
    new.raw_user_meta_data ->> 'gender',
    new.raw_user_meta_data ->> 'age_group'
  );
  return new;
end;
$$;

-- 계정이 하나 추가된 직후마다 위 함수를 자동으로 실행
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이메일 사용 가능 여부 (없으면 true, 대소문자 무시)
create function public.check_email_available(e text)
returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from auth.users where lower(email) = lower(e));
$$;

-- 닉네임 사용 가능 여부 (없으면 true)
create function public.check_nickname_available(n text)
returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where nickname = n);
$$;

-- 로그인 전(anon)에도 위 두 함수를 부를 수 있게 허용
grant execute on function public.check_email_available(text) to anon, authenticated;
grant execute on function public.check_nickname_available(text) to anon, authenticated;

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

------------------------------------------
-- 3. 모집 글 테이블 · 글쓰기 화면의 입력칸 하나가 컬럼 하나
------------------------------------------
create table public.mate_posts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  team text not null check (team in ('LG','두산','KIA','삼성','롯데','한화','SSG','NC','KT','키움')),
  game_id bigint not null references public.games (id),
  title text not null check (char_length(title) between 1 and 50),
  seat text not null check (seat in ('응원석','테이블석','내야석','외야석')),
  capacity int not null check (capacity between 2 and 10),
  ages text[] not null default '{}' check (ages <@ array['10대','20대','30대','40대 이상']),
  gender text not null default '무관' check (gender in ('여성','남성','무관')),
  description text not null default '' check (char_length(description) <= 500),
  image_url text,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

-- 목록 조회(내 팀 글을 최신순, 오래된순)와 경기별 조회를 빠르게
create index on public.mate_posts (team, created_at desc);
create index on public.mate_posts (game_id);

-- 행 단위 접근 규칙(RLS) 켜기: 아래 정책이 허용한 요청만 통과
alter table public.mate_posts enable row level security;

-- 로그인 안 한 사람과 로그인한 사람의 기본 권한을 우선 모두 회수한다
revoke all on public.mate_posts from anon, authenticated;

-- 조회: 내 응원팀과 관련된 메이트 모집 글만 보인다
grant select on public.mate_posts to authenticated;

create policy "mate_posts_select_same_team" on public.mate_posts
  for select to authenticated using (team = (select team from public.profiles where id = auth.uid()));

-- 쓰기: 방장은 나, 팀은 내 응원팀, 경기는 "내 팀이 뛰는 아직 시작 안 한 경기"만 고를 수 있다
grant insert (team, game_id, title, seat, capacity, ages, gender, description, image_url) on public.mate_posts to authenticated;

create policy "mate_posts_insert_own" on public.mate_posts
  for insert to authenticated
  with check (
    host_id = auth.uid()
    and team = (select team from public.profiles where id = auth.uid())
    and exists (
      select 1 from public.games g
      where g.id = game_id
        and g.status = 'scheduled'
        and g.game_at > now()
        and (g.home_team = team or g.away_team = team)
    )
  );

-- 수정: 방장만 모집 마감으로 변경 가능하다.
grant update (title, seat, capacity, ages, gender, description, image_url, status) on public.mate_posts to authenticated;

create policy "mate_posts_update_host" on public.mate_posts
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

-- 삭제: 방장만 모입 삭제 가능하다.
grant delete on public.mate_posts to authenticated;

create policy "mate_posts_delete_host" on public.mate_posts
  for delete to authenticated
  using (host_id = auth.uid());

create view public.mate_post_list with (security_invoker = true) as
select
    p.id,
    p.team,
    p.title,
    p.image_url,
    (p.status = 'open') as is_open,
    p.capacity as max_members,
    1 as joined_count,
    p.seat,
    p.ages,
    p.gender,
    p.created_at,
    p.game_id,
    g.game_at,
    g.home_team,
    g.away_team,
    g.stadium as stadium_name,
    p.host_id,
    h.nickname as host_nickname,
    null::text as host_avatar_url,
    h.manner_avg as host_manner
from public.mate_posts p
         join public.games g on g.id = p.game_id
         join public.profiles h on h.id = p.host_id;

revoke all on public.mate_post_list from anon, authenticated;

grant select on public.mate_post_list to authenticated;