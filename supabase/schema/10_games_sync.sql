-- 경기 자동 갱신 준비 (실행 순서: 09 다음 · games 가 있어야 한다)
------------------------------------------
-- 외부 경기 정보(API-Sports)의 경기 번호 · 같은 경기를 다시 받아도 새 줄을 만들지 않고 그 줄을 고치게 한다
-- 직접 넣은 경기는 이 칸이 비어 있고, 자동 갱신은 이 칸이 있는 경기만 다룬다
------------------------------------------
alter table public.games add column if not exists api_game_id bigint unique;

-- API 가 새 칸을 바로 알아보도록 스키마 캐시를 새로고침
notify pgrst, 'reload schema';
