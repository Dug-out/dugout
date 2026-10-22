-- Supabase 대시보드 > SQL Editor 에서 실행
-- 전제: Authentication > Providers > Email 에서 "Confirm email"을 끈다

-- ─────────────────────────────────────────────
-- 1. 공개 프로필 · 로그인한 사용자 누구나 조회
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 10),
  team text not null check (team in ('LG','DOOSAN','KIA','SAMSUNG','LOTTE','HANWHA','SSG','NC','KT','KIWOOM')),
  manner_avg numeric(4,3) not null default 0.250 check (manner_avg between 0.200 and 0.400),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. 비공개 정보 · 성별 / 나이대는 본인만 조회 (다른 사람에게는 API로도 내려가지 않는다)
--    모집 조건 확인은 서버 함수가 대신 한다 (참여 신청 함수에서 이 표를 읽는다)
-- ─────────────────────────────────────────────
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  gender text not null check (gender in ('여성','남성')),
  age_group text not null check (age_group in ('10대','20대','30대','40대 이상'))
);

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "profile_private_select_own" on public.profile_private
  for select to authenticated using (auth.uid() = id);

create policy "profile_private_update_own" on public.profile_private
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 행 생성은 아래 트리거만 한다. 수정은 허용한 컬럼만 (매너 타율은 클라이언트가 못 바꾼다)
revoke insert, update on public.profiles from anon, authenticated;
grant update (nickname, team) on public.profiles to authenticated;
revoke insert, update on public.profile_private from anon, authenticated;
grant update (gender, age_group) on public.profile_private to authenticated;

-- ─────────────────────────────────────────────
-- 3. 가입 시 프로필 자동 생성
--    프론트는 supabase.auth.signUp({ email, password, options: { data: { nickname, team, gender, age_group } } })
--    계정과 프로필이 한 번에 만들어지고, 하나라도 규칙에 어긋나면 가입 전체가 취소된다.
-- ─────────────────────────────────────────────
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, team)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nickname',
    new.raw_user_meta_data ->> 'team'
  );
  insert into public.profile_private (id, gender, age_group)
  values (
    new.id,
    new.raw_user_meta_data ->> 'gender',
    new.raw_user_meta_data ->> 'age_group'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 4. 가입 화면의 중복 확인 · 로그인 전에 부르므로 anon도 실행 가능
-- ─────────────────────────────────────────────
create function public.check_email_available(e text)
returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from auth.users where lower(email) = lower(e));
$$;

create function public.check_nickname_available(n text)
returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where nickname = n);
$$;

grant execute on function public.check_email_available(text) to anon, authenticated;
grant execute on function public.check_nickname_available(text) to anon, authenticated;
