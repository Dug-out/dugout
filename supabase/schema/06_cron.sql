-- 정해진 시간마다 도는 작업 (실행 순서: 05 다음 · mate_posts, games 가 있어야 한다)
-- Supabase 대시보드 Database → Extensions 에서 pg_cron 을 켜 두거나 아래 첫 줄로 켠다
create extension if not exists pg_cron;

------------------------------------------
-- 경기가 시작된 모집 글을 마감 · 매 분 실행
-- 시간이 지나서 바뀌는 일은 트리거가 못 잡으므로 예약 작업이 맡는다
-- (정원이 차서 닫히는 건 05_mate_members.sql 의 트리거가 한다)
------------------------------------------
-- 같은 이름의 작업이 이미 있으면 지우고 다시 만든다 (여러 번 실행해도 안전)
select cron.unschedule(jobid) from cron.job where jobname = 'close-started-mate-posts';

select cron.schedule(
  'close-started-mate-posts',
  '* * * * *',
  $$
  update public.mate_posts p
  set status = 'closed'
  from public.games g
  where p.game_id = g.id
    and p.status = 'open'
    and g.game_at <= now();
  $$
);
