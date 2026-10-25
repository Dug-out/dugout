-- 메이트 모집 글 · 목록용 뷰 (실행 순서: 02 다음 · profiles, games 가 있어야 한다)
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
  image_url text check (image_url is null or (char_length(image_url) <= 500 and image_url like '%/storage/v1/object/public/mate-images/%')),
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

-- 수정: 방장은 제목, 소개, 대표 이미지만 고칠 수 있다 (정원·좌석·나이대·성별·경기·모집 상태는 못 바꾼다)
-- 모집 상태(status)는 수락된 인원에 따라 05_mate_members.sql 의 트리거가 바꾼다
grant update (title, description, image_url) on public.mate_posts to authenticated;

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
    h.avatar_url as host_avatar_url,
    h.manner_avg as host_manner
from public.mate_posts p
         join public.games g on g.id = p.game_id
         join public.profiles h on h.id = p.host_id;

revoke all on public.mate_post_list from anon, authenticated;

grant select on public.mate_post_list to authenticated;
