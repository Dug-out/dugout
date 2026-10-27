-- 경기 자동 갱신 (실행 순서: 09 다음)
------------------------------------------
-- 1. 외부 경기 번호 칸 · 02_games.sql 에도 있어서 새로 만든 DB 에서는 건너뛰고, 이미 만들어 둔 DB 에는 칸을 더한다
------------------------------------------
alter table public.games add column if not exists api_game_id bigint unique;

notify pgrst, 'reload schema';

------------------------------------------
-- 2. 정해진 시간마다 경기 가져오기 · sync-games 함수(supabase/functions/sync-games)를 먼저 배포한 뒤 실행한다
--  · 한국 시간 낮 12시~밤 12시에 10분마다: 어제·오늘·내일 경기 (끝난 경기의 점수를 채우고, 내일로 옮겨진 경기를 알아챈다)
--  · 하루 한 번(한국 시간 새벽 4시): 올해 전체 경기 (일정 변경과 새 경기를 맞춘다)
-- 준비: 아래 둘을 실행하기 전에 <프로젝트-ref> 를 본인 프로젝트 주소의 앞부분으로 바꾸고,
--       비밀 문구를 Vault 에 한 번 저장한다 (함수의 SYNC_SECRET 과 같은 값)
--       select vault.create_secret('정한-비밀-문구', 'sync_secret');
------------------------------------------
create extension if not exists pg_net;

-- 같은 이름의 작업이 이미 있으면 지우고 다시 만든다 (여러 번 실행해도 안전)
select cron.unschedule(jobid) from cron.job where jobname in ('sync-games-recent', 'sync-games-full');

select cron.schedule(
  'sync-games-recent',
  '*/10 3-14 * * *',  -- 한국 시간 12시~24시 (UTC 3시~14시)
  $$
  select net.http_post(
    url := 'https://<프로젝트-ref>.supabase.co/functions/v1/sync-games',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret')
    ),
    body := '{"mode": "recent"}'::jsonb
  );
  $$
);

-- pg_cron 은 세계 표준시(UTC) 기준이라 한국 시간 새벽 4시는 19시
select cron.schedule(
  'sync-games-full',
  '0 19 * * *',
  $$
  select net.http_post(
    url := 'https://<프로젝트-ref>.supabase.co/functions/v1/sync-games',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret')
    ),
    body := '{"mode": "full"}'::jsonb
  );
  $$
);
