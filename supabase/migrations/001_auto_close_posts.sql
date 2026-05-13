-- 만료된 게시글 자동 종료 스케줄 설정
-- Supabase Dashboard > Database > Extensions 에서 pg_cron 활성화 후 실행
--
-- 실행 방법:
--   Supabase SQL Editor 에서 이 파일 전체 붙여넣기 후 실행
--
-- 이미 스케줄이 등록되어 있으면 중복 방지를 위해 먼저 삭제 후 재등록

SELECT cron.unschedule('close-expired-posts')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'close-expired-posts'
  );

-- 매 5분마다 close_expired_posts() 실행
SELECT cron.schedule(
  'close-expired-posts',
  '*/5 * * * *',
  $$SELECT public.close_expired_posts();$$
);

-- 등록 확인
SELECT jobid, jobname, schedule, command, active
  FROM cron.job
 WHERE jobname = 'close-expired-posts';
