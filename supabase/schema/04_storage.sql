-- 프로필 사진 저장소 (실행 순서: 03 다음 · 01_profiles 의 avatar_url 이 있어야 한다)

-- avatars 버킷 · 공개(주소만 알면 누구나 사진을 볼 수 있다), 2MB 이하, jpeg/png/webp 만
-- 이미 있으면 설정만 맞춘다
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 사진 파일은 {내 id}/avatar.jpg 경로에 저장한다. 로그인한 사람은 자기 폴더의 파일만 다룰 수 있다
-- (공개 버킷이라 사진을 화면에 보여 주는 데는 별도 읽기 정책이 필요 없다)

-- 같은 경로에 덮어쓰기(upsert)를 하려면 조회·추가·수정 정책이 모두 필요하다
create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 기본 이미지로 되돌릴 때 사진 파일을 지울 수 있다
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
