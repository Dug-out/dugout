-- 승부 예측 (실행 순서: 08 다음 · profiles, games 가 있어야 한다)
------------------------------------------
-- 1. 예측 테이블 · 사람 한 명이 경기 하나에 남긴 최종 스코어가 한 줄
-- 점수는 홈/원정 기준으로 저장한다 (내 팀 기준 승·무·패는 화면이 계산)
------------------------------------------
create table public.predictions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  game_id bigint not null references public.games (id) on delete cascade,
  home_score int not null check (home_score between 0 and 30),
  away_score int not null check (away_score between 0 and 30),
  points int check (points >= 0),  -- 채점 전에는 비어 있다 (채점은 아래 트리거가 한다)
  created_at timestamptz not null default now(),
  unique (user_id, game_id)  -- 한 경기에 한 번만 예측하고, 시작 전까지 고친다
);

-- 내 예측 목록과 경기별 집계를 빠르게
create index on public.predictions (user_id, created_at desc);
create index on public.predictions (game_id);

alter table public.predictions enable row level security;

-- 기본으로 열려 있던 권한을 모두 회수한 뒤 필요한 것만 다시 연다
revoke all on public.predictions from anon, authenticated;

------------------------------------------
-- 2. 접근 규칙
------------------------------------------
-- 조회: 내 예측만 (다른 사람의 예측은 아래 집계 함수로 숫자만 본다)
grant select on public.predictions to authenticated;

create policy "predictions_select_own" on public.predictions
  for select to authenticated using (user_id = auth.uid());

-- 예측하기 · 고치기: 아직 시작 전인 예정 경기만 (games 조회 규칙 덕분에 내 응원팀 경기만 보인다)
-- points 는 사용자가 못 바꾼다 · 삭제 권한은 주지 않는다
grant insert (game_id, home_score, away_score) on public.predictions to authenticated;
grant update (home_score, away_score) on public.predictions to authenticated;

create policy "predictions_insert_before_start" on public.predictions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.games g
      where g.id = game_id and g.status = 'scheduled' and g.game_at > now()
    )
  );

create policy "predictions_update_before_start" on public.predictions
  for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.games g
      where g.id = game_id and g.status = 'scheduled' and g.game_at > now()
    )
  )
  with check (user_id = auth.uid());

------------------------------------------
-- 3. 채점 · 경기가 끝난 것으로 바뀌는 순간 그 경기의 예측에 점수를 채운다
--  · 승·무·패를 맞히면 10점
--  · 스코어까지 맞히면 10점 + (그 경기 참여자 수 ÷ 스코어를 맞힌 사람 수), 소수점은 버린다
--  · 빗나가면 0점
-- 점수는 경기 종료 때 한 번 정해지고 그 뒤에는 바뀌지 않는다
-- predictions.points 는 사용자가 못 바꾸므로 관리자 권한 함수가 대신 채운다
------------------------------------------
create function public.grade_predictions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  total int;
  exact int;
  bonus int;
begin
  select count(*),
         count(*) filter (where home_score = new.home_score and away_score = new.away_score)
    into total, exact
  from public.predictions
  where game_id = new.id;

  bonus := case when exact > 0 then total / exact else 0 end;

  update public.predictions p
  set points = case
    when p.home_score = new.home_score and p.away_score = new.away_score then 10 + bonus
    when sign(p.home_score - p.away_score) = sign(new.home_score - new.away_score) then 10
    else 0
  end
  where p.game_id = new.id;

  return null;
end;
$$;

create trigger on_game_finished
  after update of status on public.games
  for each row
  when (new.status = 'finished' and old.status <> 'finished')
  execute function public.grade_predictions();

------------------------------------------
-- 4. 경기별 팬 예측 비율 · 내 응원팀 팬들이 승·무·패와 어떤 스코어를 많이 골랐는지 (승·무·패는 내 팀 기준)
-- 다른 사람의 예측 줄은 숨겨져 있으므로 관리자 권한 함수로 숫자만 센다 (누가 골랐는지는 내려주지 않는다)
-- top_* : 가장 많이 예측한 스코어 (내 팀 점수 : 상대 점수) · 아무도 예측하지 않았으면 모두 0
------------------------------------------
create function public.game_prediction_stats(p_game bigint)
returns table (total int, win int, draw int, lose int, top_my int, top_opp int, top_count int)
language sql stable security definer set search_path = public as $$
  with me as (
    select team from public.profiles where id = auth.uid()
  ),
  picks as (
    select
      case when g.home_team = me.team then p.home_score else p.away_score end as my_score,
      case when g.home_team = me.team then p.away_score else p.home_score end as opp_score
    from public.predictions p
    join public.games g on g.id = p.game_id
    join public.profiles pr on pr.id = p.user_id
    join me on pr.team = me.team
    where p.game_id = p_game
      and (g.home_team = me.team or g.away_team = me.team)
  ),
  top as (
    select my_score, opp_score, count(*)::int as n
    from picks group by my_score, opp_score
    order by n desc, my_score desc, opp_score
    limit 1
  )
  select
    (select count(*) from picks)::int,
    (select count(*) from picks where my_score > opp_score)::int,
    (select count(*) from picks where my_score = opp_score)::int,
    (select count(*) from picks where my_score < opp_score)::int,
    coalesce((select my_score from top), 0),
    coalesce((select opp_score from top), 0),
    coalesce((select n from top), 0);
$$;

revoke execute on function public.game_prediction_stats(bigint) from public, anon;
grant execute on function public.game_prediction_stats(bigint) to authenticated;

------------------------------------------
-- 5. 순위 계산 · 같은 응원팀 사람들의 점수 합 (채점된 예측만)
--  · 'month': 이번 달에 열린 경기 / 'season': 올해 경기 (경기 날짜 기준, 한국 시간)
--  · 채점된 예측이 하나도 없는 사람은 순위에 넣지 않는다 · 점수가 같으면 같은 순위
-- 이 함수는 아래 두 함수만 부르고 화면에서는 직접 부르지 못한다
------------------------------------------
create function public.prediction_standings(p_period text)
returns table (rank int, user_id uuid, nickname text, avatar_url text, points int)
language sql stable security definer set search_path = public as $$
  select
    (rank() over (order by sum(p.points) desc))::int,
    pr.id, pr.nickname, pr.avatar_url, sum(p.points)::int
  from public.predictions p
  join public.games g on g.id = p.game_id
  join public.profiles pr on pr.id = p.user_id
  where p.points is not null
    and pr.team = (select team from public.profiles where id = auth.uid())
    and case p_period
      when 'month' then date_trunc('month', g.game_at) = date_trunc('month', now())
      when 'season' then date_trunc('year', g.game_at) = date_trunc('year', now())
      else false
    end
  group by pr.id, pr.nickname, pr.avatar_url;
$$;

revoke execute on function public.prediction_standings(text) from public, anon, authenticated;

------------------------------------------
-- 6. 랭킹 · 1~10위와 내 순위 (내가 10위 밖이어도 내 줄은 항상 따라온다)
------------------------------------------
create function public.prediction_ranking(p_period text)
returns table (rank int, user_id uuid, nickname text, avatar_url text, points int, is_me boolean)
language sql stable security definer set search_path = public as $$
  select s.rank, s.user_id, s.nickname, s.avatar_url, s.points, s.user_id = auth.uid()
  from public.prediction_standings(p_period) s
  where s.rank <= 10 or s.user_id = auth.uid()
  order by s.rank, s.nickname;
$$;

revoke execute on function public.prediction_ranking(text) from public, anon;
grant execute on function public.prediction_ranking(text) to authenticated;

------------------------------------------
-- 7. 내 누적 점수와 순위 · 월간과 시즌 (내 기록 화면) · 점수가 없으면 rank 는 비어 있다
------------------------------------------
create function public.my_prediction_summary()
returns table (period text, points int, rank int)
language sql stable security definer set search_path = public as $$
  select v.period, coalesce(s.points, 0), s.rank
  from (values ('month'), ('season')) as v(period)
  left join lateral (
    select st.points, st.rank
    from public.prediction_standings(v.period) st
    where st.user_id = auth.uid()
  ) s on true;
$$;

revoke execute on function public.my_prediction_summary() from public, anon;
grant execute on function public.my_prediction_summary() to authenticated;

-- API 가 새 함수를 바로 알아보도록 스키마 캐시를 새로고침
notify pgrst, 'reload schema';
