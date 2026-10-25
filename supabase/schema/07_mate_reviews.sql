-- 메이트 평가 (실행 순서: 06 다음 · profiles, games, mate_posts, mate_members 가 있어야 한다)
------------------------------------------
-- 1. 평가 테이블 · 같은 글에서 사람 한 명이 다른 사람 한 명을 평가한 것이 한 줄
------------------------------------------
create table public.mate_reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.mate_posts (id) on delete cascade,
  reviewer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,  -- 평가한 사람 (나만 볼 수 있다)
  reviewee_id uuid not null references public.profiles (id) on delete cascade,  -- 평가받은 사람
  met boolean not null,  -- true: 만났어요 · false: 상대가 안 왔어요(노쇼)
  score int check (score between 1 and 10),  -- 만났을 때만 1~10점
  comment text not null default '' check (char_length(comment) <= 100),  -- 한 줄 후기
  created_at timestamptz not null default now(),
  unique (post_id, reviewer_id, reviewee_id),  -- 같은 글에서 같은 사람은 한 번만 평가한다
  check (reviewer_id <> reviewee_id),
  -- 만났으면 점수가 있어야 하고, 노쇼면 점수도 후기도 없다
  check ((met and score is not null) or (not met and score is null and comment = ''))
);

-- 받은 평가 조회(프로필, 매너 후기)와 내가 한 평가 조회를 빠르게
create index on public.mate_reviews (reviewee_id, created_at desc);
create index on public.mate_reviews (reviewer_id, post_id);

alter table public.mate_reviews enable row level security;

-- 기본으로 열려 있던 권한을 모두 회수한 뒤 필요한 것만 다시 연다
revoke all on public.mate_reviews from anon, authenticated;

------------------------------------------
-- 2. 정책에서 쓰는 확인 함수 · 특정 사람이 이 글의 수락된 참여자(방장 포함)인지
-- 정책 안에서 mate_members 를 다시 조회하면 정책이 끝없이 반복되므로 관리자 권한 함수로 확인한다
------------------------------------------
create function public.is_accepted_member(p uuid, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.mate_members where post_id = p and user_id = u and status = 'accepted'
  );
$$;

revoke execute on function public.is_accepted_member(uuid, uuid) from public, anon;
grant execute on function public.is_accepted_member(uuid, uuid) to authenticated;

------------------------------------------
-- 3. 접근 규칙
------------------------------------------
-- 조회: 내가 한 평가만 볼 수 있다 (남이 나를 어떻게 평가했는지는 아래 public_reviews 뷰로만 본다)
grant select on public.mate_reviews to authenticated;

create policy "mate_reviews_select_own" on public.mate_reviews
  for select to authenticated using (reviewer_id = auth.uid());

-- 평가하기: 나와 상대가 같은 글의 수락된 참여자이고, 이미 끝난 경기일 때만
-- (경기 후 7일 안인지는 아래 my_review_todos 목록이 거른다)
-- 수정·삭제 권한은 주지 않는다
grant insert (post_id, reviewee_id, met, score, comment) on public.mate_reviews to authenticated;

create policy "mate_reviews_insert" on public.mate_reviews
  for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and public.is_accepted_member(post_id, auth.uid())
    and public.is_accepted_member(post_id, reviewee_id)
    and exists (
      select 1 from public.mate_posts p
      join public.games g on g.id = p.game_id
      where p.id = post_id and g.status = 'finished'
    )
  );

------------------------------------------
-- 4. 받은 평가 공개 · 누가 썼는지(reviewer_id)는 빼고 점수와 후기만
-- 뷰는 만든 사람(관리자) 권한으로 읽기 때문에 위 정책과 상관없이 모든 평가를 보여 주되, 평가자 칸이 없다
-- 노쇼는 점수가 없으므로 후기 목록에서 뺀다
------------------------------------------
create view public.public_reviews as
select r.id, r.post_id, r.reviewee_id, r.score, r.comment, r.created_at
from public.mate_reviews r
where r.met;

revoke all on public.public_reviews from anon, authenticated;
grant select on public.public_reviews to authenticated;

------------------------------------------
-- 5. 평가할 메이트 목록 · 내가 수락된 글에서 함께 간 다른 수락된 사람 중
--    끝난 지 7일 안이고 아직 평가하지 않은 사람 (days_left: 평가할 수 있는 남은 일수)
-- 다른 참여자의 줄은 mate_members 규칙이 숨기므로 관리자 권한 함수로 만든다
------------------------------------------
create function public.my_review_todos()
returns table (
  post_id uuid, post_title text, game_at timestamptz, home_team text, away_team text, stadium text,
  user_id uuid, role text, nickname text, avatar_url text, days_left int
)
language sql stable security definer set search_path = public as $$
  select
    po.id, po.title, g.game_at, g.home_team, g.away_team, g.stadium,
    m2.user_id, m2.role, pr.nickname, pr.avatar_url,
    greatest(0, ceil(extract(epoch from (g.game_at + interval '7 days' - now())) / 86400))::int
  from public.mate_members m1
  join public.mate_posts po on po.id = m1.post_id
  join public.games g on g.id = po.game_id
  join public.mate_members m2 on m2.post_id = po.id and m2.status = 'accepted' and m2.user_id <> m1.user_id
  join public.profiles pr on pr.id = m2.user_id
  where m1.user_id = auth.uid()
    and m1.status = 'accepted'
    and g.status = 'finished'
    and g.game_at > now() - interval '7 days'
    and not exists (
      select 1 from public.mate_reviews r
      where r.post_id = po.id and r.reviewer_id = auth.uid() and r.reviewee_id = m2.user_id
    )
  order by g.game_at desc, pr.nickname;
$$;

revoke execute on function public.my_review_todos() from public, anon;
grant execute on function public.my_review_todos() to authenticated;

------------------------------------------
-- 6. 매너 타율 반영 · 평가가 들어오면 받은 사람의 매너 타율에 더한다
--  · 만났으면 (점수 - 6) × 0.002 (6점이면 변화 없음) · 노쇼면 -0.020 (접수되면 바로 반영)
--  · .200 아래로는 내려가지 않고 .400 위로는 올라가지 않는다
-- profiles.manner_avg 는 사용자가 직접 못 바꾸므로 관리자 권한 함수가 대신 바꾼다
------------------------------------------
create function public.apply_review_to_manner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set manner_avg = greatest(0.200, least(0.400,
    manner_avg + case when new.met then (new.score - 6) * 0.002 else -0.020 end
  ))
  where id = new.reviewee_id;
  return null;
end;
$$;

create trigger on_mate_review_created
  after insert on public.mate_reviews
  for each row execute function public.apply_review_to_manner();

-- API 가 새 함수·뷰를 바로 알아보도록 스키마 캐시를 새로고침
notify pgrst, 'reload schema';
