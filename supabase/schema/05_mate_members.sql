-- 모집 글 참여자 (방장 · 신청 · 수락) (실행 순서: 03 다음 · mate_posts, profiles 가 있어야 한다)
------------------------------------------
-- 1. 참여자 테이블 · 모집 글 하나에 사람 한 명이 한 줄
------------------------------------------
create table public.mate_members (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.mate_posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('host','member')),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','left')),
  message text not null default '' check (char_length(message) <= 100),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- 내가 참여한 글 조회(내 직관 약속)와 글별 참여자 조회를 빠르게
create index on public.mate_members (user_id, status);
create index on public.mate_members (post_id, status);

-- 행 단위 접근 규칙(RLS) 켜기: 아래 정책이 허용한 요청만 통과
alter table public.mate_members enable row level security;

-- 기본으로 열려 있던 권한을 모두 회수한 뒤 필요한 것만 다시 연다
revoke all on public.mate_members from anon, authenticated;

------------------------------------------
-- 2. 정책에서 쓰는 확인 함수
-- 정책 안에서 mate_members 를 다시 조회하면 정책이 끝없이 반복되므로, 관리자 권한 함수로 확인한다
------------------------------------------
-- 내가 이 글의 방장인지
create function public.is_post_host(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mate_posts where id = p and host_id = auth.uid());
$$;

-- 내가 이 글에 수락된 참여자(방장 포함)인지
create function public.is_post_member(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.mate_members where post_id = p and user_id = auth.uid() and status = 'accepted'
  );
$$;

revoke execute on function public.is_post_host(uuid), public.is_post_member(uuid) from public, anon;
grant execute on function public.is_post_host(uuid), public.is_post_member(uuid) to authenticated;

------------------------------------------
-- 3. 접근 규칙
------------------------------------------
-- 조회: 내 줄, 내가 방장인 글의 신청자 전체, 내가 수락된 글의 수락된 참여자
grant select on public.mate_members to authenticated;

create policy "mate_members_select" on public.mate_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_post_host(post_id)
    or (status = 'accepted' and public.is_post_member(post_id))
  );

-- 신청: 내 이름으로, 모집 중이고 아직 시작 안 한 경기의 남의 글에, 대기 상태로만 (사용자는 글과 한마디만 보낸다)
grant insert (post_id, message) on public.mate_members to authenticated;

create policy "mate_members_insert_apply" on public.mate_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'member'
    and status = 'pending'
    and exists (
      select 1 from public.mate_posts p
      join public.games g on g.id = p.game_id
      where p.id = post_id
        and p.status = 'open'
        and p.host_id <> auth.uid()
        and g.status = 'scheduled'
        and g.game_at > now()
    )
  );

-- 상태 변경: 방장은 신청자를 수락·거절, 신청자는 스스로 나감 (방장 본인의 줄은 바꿀 수 없다)
grant update (status) on public.mate_members to authenticated;

create policy "mate_members_update_status" on public.mate_members
  for update to authenticated
  using (public.is_post_host(post_id) or user_id = auth.uid())
  with check (
    role = 'member'
    and (
      (public.is_post_host(post_id) and status in ('accepted','rejected'))
      or (user_id = auth.uid() and status = 'left')
    )
  );

------------------------------------------
-- 4. 방장 자동 등록 · 정원 확인
------------------------------------------
-- 모집 글이 올라오면 방장을 수락된 참여자로 넣는다
create function public.add_host_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.mate_members (post_id, user_id, role, status)
  values (new.id, new.host_id, 'host', 'accepted');
  return new;
end;
$$;

create trigger on_mate_post_created
  after insert on public.mate_posts
  for each row execute function public.add_host_member();

-- 상태가 바뀔 때 지켜야 할 규칙 (정책은 바뀐 뒤의 값만 볼 수 있어서 여기서 이전 값과 비교한다)
--  · 거절·나감으로 끝난 줄은 다시 바꿀 수 없다
--  · 수락된 사람을 방장이 거절로 바꿀 수 없다 (나가는 것만 가능)
--  · 수락할 때 정원(방장 포함)이 이미 찼으면 막는다
create function public.check_member_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status in ('rejected','left') then
    raise exception '이미 끝난 신청이에요' using errcode = '23514';
  end if;

  if old.status = 'accepted' and new.status <> 'left' then
    raise exception '수락된 참여자는 나가기만 할 수 있어요' using errcode = '23514';
  end if;

  if new.status = 'accepted' then
    -- 같은 글을 동시에 수락해도 정원을 넘지 않도록 글 줄을 잠그고 센다
    if (select count(*) from public.mate_members where post_id = new.post_id and status = 'accepted')
       >= (select capacity from public.mate_posts where id = new.post_id for update) then
      raise exception '모집 인원이 가득 찼어요' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger on_mate_member_status_change
  before update of status on public.mate_members
  for each row execute function public.check_member_status_change();

-- 이미 올라와 있던 글의 방장도 참여자로 넣는다 (이 문장만 여러 번 실행해도 안전)
insert into public.mate_members (post_id, user_id, role, status)
select id, host_id, 'host', 'accepted' from public.mate_posts
on conflict (post_id, user_id) do nothing;

------------------------------------------
-- 5. 수락된 인원 수 · 화면에서 mate_posts 를 조회할 때 joined_count 컬럼처럼 고를 수 있다
-- 신청 대기 중인 사람은 다른 참여자 줄을 볼 수 없어서(RLS), 관리자 권한 함수로 센다
------------------------------------------
create function public.joined_count(p public.mate_posts)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.mate_members where post_id = p.id and status = 'accepted';
$$;

revoke execute on function public.joined_count(public.mate_posts) from public, anon;
grant execute on function public.joined_count(public.mate_posts) to authenticated;

-- API 가 새 함수를 바로 알아보도록 스키마 캐시를 새로고침
notify pgrst, 'reload schema';

------------------------------------------
-- 6. 수락된 참여자 목록 · 모집 글 상세의 "함께 가는 메이트"
-- 신청 전인 사람도 누가 가는지 볼 수 있어야 하지만 mate_members RLS 는 다른 참여자 줄을 숨기므로,
-- 관리자 권한 함수로 수락된 사람의 닉네임·사진만 돌려준다 (보는 사람이 글과 같은 응원팀일 때만)
------------------------------------------
create function public.mate_post_members(p uuid)
returns table (user_id uuid, role text, nickname text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.role, pr.nickname, pr.avatar_url
  from public.mate_members m
  join public.profiles pr on pr.id = m.user_id
  join public.mate_posts po on po.id = m.post_id
  where m.post_id = p
    and m.status = 'accepted'
    and po.team = (select team from public.profiles where id = auth.uid())
  order by (m.role = 'host') desc, m.created_at;
$$;

revoke execute on function public.mate_post_members(uuid) from public, anon;
grant execute on function public.mate_post_members(uuid) to authenticated;

notify pgrst, 'reload schema';

------------------------------------------
-- 7. 모집 상태 자동 맞추기 · 수락된 인원이 정원이 되면 closed, 자리가 나면 open
-- 방장은 status 를 직접 바꾸지 못하므로 관리자 권한 함수가 대신 바꾼다
--  · 열려 있는 글: 수락된 인원이 정원 이상이면 닫는다
--  · 닫힌 글: 자리가 났고 경기가 아직 시작 전일 때만 다시 연다 (경기 시작 뒤 닫는 일은 이후 pg_cron 이 맡는다)
------------------------------------------
create function public.sync_post_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.post_id, old.post_id);
begin
  update public.mate_posts p
  set status = case when p.status = 'open' then 'closed' else 'open' end
  where p.id = pid
    and (
      (p.status = 'open' and public.joined_count(p) >= p.capacity)
      or (
        p.status = 'closed'
        and public.joined_count(p) < p.capacity
        and exists (select 1 from public.games g where g.id = p.game_id and g.game_at > now())
      )
    );
  return null;
end;
$$;

-- 참여자 줄이 생기거나, 상태가 바뀌거나, 지워진 직후마다 실행
create trigger on_mate_member_changed
  after insert or update of status or delete on public.mate_members
  for each row execute function public.sync_post_status();

-- 이미 올라와 있던 글 중 정원이 찬 글은 한 번 닫아 둔다 (여러 번 실행해도 안전)
update public.mate_posts p set status = 'closed' where p.status = 'open' and public.joined_count(p) >= p.capacity;
