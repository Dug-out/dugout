-- 모집 채팅방 (실행 순서: 07 다음 · mate_posts, mate_members, profiles 가 있어야 한다)
-- 채팅방은 모집 글 하나에 하나이고, 수락된 참여자(방장 포함)만 대화를 보고 보낸다
------------------------------------------
-- 1. 수락된 시각 · "수락된 뒤의 대화만 볼 수 있다"를 위해 참여자 줄에 기록한다
------------------------------------------
alter table public.mate_members add column accepted_at timestamptz;

-- 이미 수락돼 있던 줄은 신청한 시각으로 채운다 (여러 번 실행해도 안전)
update public.mate_members set accepted_at = created_at where status = 'accepted' and accepted_at is null;

-- 수락되는 순간(방장 줄은 글을 올릴 때)의 시각을 넣는다
create function public.set_accepted_at()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'accepted' then
      new.accepted_at := now();
    end if;
  elsif new.status = 'accepted' and old.status <> 'accepted' then
    new.accepted_at := now();
  end if;
  return new;
end;
$$;

create trigger on_mate_member_accepted_at
  before insert or update of status on public.mate_members
  for each row execute function public.set_accepted_at();

------------------------------------------
-- 2. 메시지 테이블 · 사람이 보낸 메시지(message)와 시스템 안내(accepted, left)가 한 줄씩
--  · accepted: 참여 수락 / left: 채팅방 나감 (target_id 가 그 사람)
-- 안내 문구는 보는 사람에 따라 달라서(예: "나의 참여를 수락했어요") 글자가 아니라 종류와 대상을 저장한다
------------------------------------------
create table public.chat_messages (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.mate_posts (id) on delete cascade,
  sender_id uuid default auth.uid() references public.profiles (id) on delete cascade,  -- 시스템 안내는 null
  kind text not null default 'message' check (kind in ('message','accepted','left')),
  target_id uuid references public.profiles (id) on delete cascade,  -- accepted · left 에서 대상
  body text not null default '' check (char_length(body) <= 500),
  created_at timestamptz not null default now(),
  check ((kind = 'message') = (sender_id is not null)),
  check ((kind in ('accepted','left')) = (target_id is not null)),
  check (kind <> 'message' or char_length(btrim(body)) >= 1)
);

-- 채팅방 한 곳의 메시지를 시간순으로 빠르게
create index on public.chat_messages (post_id, created_at, id);

alter table public.chat_messages enable row level security;

-- 기본으로 열려 있던 권한을 모두 회수한 뒤 필요한 것만 다시 연다 (수정·삭제 권한은 주지 않는다)
revoke all on public.chat_messages from anon, authenticated;

------------------------------------------
-- 3. 접근 규칙
------------------------------------------
-- 이 글의 수락된 참여자이고, 그 메시지가 내가 수락된 뒤에 올라온 것인지
-- 정책 안에서 mate_members 를 다시 조회하면 정책이 끝없이 반복되므로 관리자 권한 함수로 확인한다
create function public.can_read_chat(p uuid, t timestamptz)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.mate_members
    where post_id = p and user_id = auth.uid() and status = 'accepted' and accepted_at <= t
  );
$$;

revoke execute on function public.can_read_chat(uuid, timestamptz) from public, anon;
grant execute on function public.can_read_chat(uuid, timestamptz) to authenticated;

-- 조회: 수락된 참여자가, 수락된 시각 이후의 메시지만 (나간 사람은 더 이상 못 본다)
grant select on public.chat_messages to authenticated;

create policy "chat_messages_select" on public.chat_messages
  for select to authenticated using (public.can_read_chat(post_id, created_at));

-- 보내기: 수락된 참여자가 내 이름으로 보통 메시지만 (시스템 안내는 아래 트리거만 넣는다)
grant insert (post_id, body) on public.chat_messages to authenticated;

create policy "chat_messages_insert" on public.chat_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and kind = 'message' and public.is_post_member(post_id));

------------------------------------------
-- 4. 시스템 안내 · 수락, 나감이 일어나면 채팅방에 자동으로 한 줄 남긴다
------------------------------------------
-- 참여자 수락·나감 (방장 줄은 제외)
create function public.announce_member_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'member' and new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.chat_messages (post_id, sender_id, kind, target_id)
    values (new.post_id, null, 'accepted', new.user_id);
  elsif new.role = 'member' and new.status = 'left' and old.status = 'accepted' then
    insert into public.chat_messages (post_id, sender_id, kind, target_id)
    values (new.post_id, null, 'left', new.user_id);
  end if;
  return null;
end;
$$;

create trigger on_mate_member_announce
  after update of status on public.mate_members
  for each row execute function public.announce_member_change();

------------------------------------------
-- 5. 실시간 · 새 메시지가 올라오면 보고 있는 사람 화면에 바로 뜬다 (조회 규칙은 위와 같이 적용된다)
------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$$;

-- API 가 새 함수·테이블을 바로 알아보도록 스키마 캐시를 새로고침
notify pgrst, 'reload schema';
