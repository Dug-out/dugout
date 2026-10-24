
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
