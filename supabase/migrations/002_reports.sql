-- ============================================================================
-- 신고(reports) 테이블
-- 게시글당 1인 1회 신고, 신고 사유 저장
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason      text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, reporter_id)   -- 게시글당 1회 신고만 허용
);

CREATE INDEX IF NOT EXISTS idx_reports_post_id     ON public.reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 인증된 유저만 신고 가능
CREATE POLICY "reports_insert_auth"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 신고 내역은 service_role 만 조회 가능 (어드민 전용)
CREATE POLICY "reports_select_none"
  ON public.reports FOR SELECT
  USING (false);
