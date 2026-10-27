-- 푸시 알림 (실행 순서: 10 다음 · profiles, mate_posts, mate_members 가 있어야 한다)
------------------------------------------
-- 1. 구독 정보 · 알림을 받겠다고 켠 기기마다 한 줄 (한 사람이 기기를 여러 개 쓸 수 있다)
-- endpoint 는 브라우저가 정해 주는 기기별 주소라서 같은 기기는 한 줄만 있다
------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- 기본으로 열려 있던 권한을 모두 회수한 뒤 필요한 것만 다시 연다
revoke all on public.push_subscriptions from anon, authenticated;

-- 조회 · 삭제: 내 구독만 (추가는 아래 함수로 한다)
grant select, delete on public.push_subscriptions to authenticated;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

------------------------------------------
-- 2. 구독 저장 · 같은 기기에서 다른 사람이 로그인해 켜면 그 기기를 새 사람의 것으로 옮긴다
-- 다른 사람 줄을 고쳐야 해서 관리자 권한 함수로 한다
------------------------------------------
create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language sql security definer set search_path = public as $$
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint)
  do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
$$;

revoke execute on function public.save_push_subscription(text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

------------------------------------------
-- 3. 알림 보내기 · send-push 함수(supabase/functions/send-push)를 불러 그 사람의 기기들로 보낸다
-- 프로젝트 주소와 비밀 문구는 Vault 에서 꺼낸다 (아래 "준비" 참고)
-- 알림이 실패해도 신청·수락 같은 본래 일이 막히면 안 되므로 오류는 삼킨다
------------------------------------------
create function public.notify_push(p_user uuid, p_title text, p_body text, p_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_secret')
    ),
    body := jsonb_build_object('user_id', p_user, 'title', p_title, 'body', p_body, 'url', p_url)
  );
exception when others then
  null;
end;
$$;

revoke execute on function public.notify_push(uuid, text, text, text) from public, anon, authenticated;

------------------------------------------
-- 4. 새 참여 신청 → 방장에게 알림 · 누르면 신청자 관리 화면
------------------------------------------
create function public.push_new_applicant()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post record;
  applicant text;
begin
  select host_id, title into post from public.mate_posts where id = new.post_id;
  select nickname into applicant from public.profiles where id = new.user_id;

  perform public.notify_push(
    post.host_id,
    '새 참여 신청',
    applicant || '님이 ''' || left(post.title, 20) || ''' 모임에 참여를 신청했어요',
    '/mate/' || new.post_id || '/manage'
  );
  return null;
end;
$$;

create trigger on_mate_applied_push
  after insert on public.mate_members
  for each row
  when (new.role = 'member' and new.status = 'pending')
  execute function public.push_new_applicant();

------------------------------------------
-- 5. 수락 · 거절 → 신청한 사람에게 알림 · 수락은 채팅방, 거절은 모집 글로 이동
------------------------------------------
create function public.push_applicant_result()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post_title text;
begin
  select left(title, 20) into post_title from public.mate_posts where id = new.post_id;

  if new.status = 'accepted' then
    perform public.notify_push(
      new.user_id, '참여가 수락됐어요', '''' || post_title || ''' 채팅방에 들어갈 수 있어요', '/chat/' || new.post_id
    );
  else
    perform public.notify_push(
      new.user_id, '신청이 거절됐어요', '''' || post_title || ''' 모임에 참여할 수 없어요', '/mate/' || new.post_id
    );
  end if;
  return null;
end;
$$;

create trigger on_mate_member_result_push
  after update of status on public.mate_members
  for each row
  when (old.status = 'pending' and new.status in ('accepted', 'rejected'))
  execute function public.push_applicant_result();

------------------------------------------
-- 6. 승부 예측 결과 → 예측한 사람에게 알림 · 채점되어 점수가 채워지는 순간 한 번 · 누르면 내 기록 화면
--  · 스코어 적중(11점 이상) / 승부 적중(10점) / 빗나감(0점)
------------------------------------------
create or replace function public.push_prediction_result()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.points = 0 then
    perform public.notify_push(new.user_id, '예측 빗나감', '아쉽게 빗나갔어요', '/predict/history');
  elsif new.points > 10 then
    perform public.notify_push(new.user_id, '스코어 적중!', '+' || new.points || '점을 얻었어요', '/predict/history');
  else
    perform public.notify_push(new.user_id, '승부 적중!', '+' || new.points || '점을 얻었어요', '/predict/history');
  end if;
  return null;
end;
$$;

create trigger on_prediction_graded_push
  after update of points on public.predictions
  for each row
  when (old.points is null and new.points is not null)
  execute function public.push_prediction_result();

-- 준비: 아래 두 값을 Vault 에 한 번 저장한다 (SQL Editor 에서 실행)
--   select vault.create_secret('https://<프로젝트-ref>.supabase.co', 'project_url');
--   select vault.create_secret('정한-비밀-문구', 'push_secret');   -- send-push 함수의 PUSH_SECRET 과 같은 값
-- pg_net 은 10_games_sync.sql 에서 이미 켰다 (안 켰다면: create extension if not exists pg_net;)

notify pgrst, 'reload schema';
