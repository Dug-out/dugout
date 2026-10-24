-- 회원 프로필 · 가입 트리거 · 가입 화면의 중복 확인 (실행 순서: 00 다음)
------------------------------------------
-- 1. 프로필 · 로그인한 사용자 누구나 조회
------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 10),
  team text not null check (team in ('LG','두산','KIA','삼성','롯데','한화','SSG','NC','KT','키움')),
  gender text not null check (gender in ('여성','남성')),
  age_group text not null check (age_group in ('10대','20대','30대','40대 이상')),
  headline text not null default '' check (char_length(headline) <= 30),
  bio text not null default '' check (char_length(bio) <= 300),
  avatar_url text check (avatar_url is null or (char_length(avatar_url) <= 500 and avatar_url like '%/storage/v1/object/public/avatars/%')),  -- 프로필 사진 주소 (avatars 버킷의 사진만, 비어 있으면 기본 이미지)
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

-- 기본으로 열려 있던 권한(삭제·TRUNCATE·TRIGGER 등)을 모두 회수한 뒤 필요한 것만 다시 연다
revoke all on public.profiles from anon, authenticated;

-- 조회: 로그인한 사람은 프로필 조회 가능 (정책과 별개로 테이블 권한도 필요)
grant select on public.profiles to authenticated;

-- 수정: 프로필 수정 화면의 항목만 (매너 타율은 직접 못 바꿈) · 행 추가는 아래 트리거만 한다
grant update (nickname, team, gender, age_group, headline, bio, avatar_url) on public.profiles to authenticated;

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
