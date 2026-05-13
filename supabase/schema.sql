-- ============================================================================
-- 모두의 솔로몬 (Solomon) — 전체 스키마
-- DDL + RLS + 트리거 + 함수
-- ----------------------------------------------------------------------------
-- 핵심 비즈니스 규칙
--   1) 24시간 블라인드 룰: expires_at 이전에는 득표 수/투표자 절대 비공개
--   2) 1인 1게시글 1회 투표 (votes UNIQUE 제약)
--   3) 게시글 status 가 'active' → 'closed' 로 바뀌면 솔로몬 지수 트리거 갱신
-- ============================================================================

-- 확장 모듈 -----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- 1-1. users -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id                       uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname                 text        NOT NULL,
  avatar_url               text,
  total_votes              integer     NOT NULL DEFAULT 0,
  majority_matched_votes   integer     NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users IS '사용자 프로필 (auth.users 와 1:1 매핑)';
COMMENT ON COLUMN public.users.total_votes IS '본인이 참여한 종료된 게시글 수';
COMMENT ON COLUMN public.users.majority_matched_votes IS '본인 투표가 1위(솔로몬의 선택)였던 횟수';


-- 1-2. posts -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  image_url   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  status      text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_posts_status     ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON public.posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_id    ON public.posts(user_id);

COMMENT ON COLUMN public.posts.status IS 'active = 진행중, closed = 종료(결과 공개)';


-- 1-3. options ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.options (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  option_text  text        NOT NULL,
  option_order integer     NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, option_order)
);

CREATE INDEX IF NOT EXISTS idx_options_post_id ON public.options(post_id);


-- 1-4. votes -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.votes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  option_id  uuid        NOT NULL REFERENCES public.options(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)               -- 1인 1게시글 1회 투표
);

CREATE INDEX IF NOT EXISTS idx_votes_post_id   ON public.votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON public.votes(option_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id   ON public.votes(user_id);


-- ============================================================================
-- 2. RLS (Row-Level Security)
-- ============================================================================

ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes   ENABLE ROW LEVEL SECURITY;


-- 2-1. users -----------------------------------------------------------------
DROP POLICY IF EXISTS "users_select_all"       ON public.users;
DROP POLICY IF EXISTS "users_insert_self"      ON public.users;
DROP POLICY IF EXISTS "users_update_self"      ON public.users;

CREATE POLICY "users_select_all"
  ON public.users FOR SELECT
  USING (true);                                            -- 누구나 프로필 SELECT 가능

CREATE POLICY "users_insert_self"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);                            -- 본인 프로필만 INSERT (트리거 보조용)

CREATE POLICY "users_update_self"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);                            -- 본인만 UPDATE


-- 2-2. posts -----------------------------------------------------------------
DROP POLICY IF EXISTS "posts_select_all"   ON public.posts;
DROP POLICY IF EXISTS "posts_insert_auth"  ON public.posts;
DROP POLICY IF EXISTS "posts_update_owner" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_owner" ON public.posts;

CREATE POLICY "posts_select_all"
  ON public.posts FOR SELECT
  USING (true);                                            -- 모두 SELECT (블라인드는 votes 단계에서 강제)

CREATE POLICY "posts_insert_auth"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);                       -- 인증된 본인만 INSERT

CREATE POLICY "posts_update_owner"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_owner"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);


-- 2-3. options ---------------------------------------------------------------
DROP POLICY IF EXISTS "options_select_all"      ON public.options;
DROP POLICY IF EXISTS "options_insert_owner"    ON public.options;
DROP POLICY IF EXISTS "options_update_owner"    ON public.options;
DROP POLICY IF EXISTS "options_delete_owner"    ON public.options;

CREATE POLICY "options_select_all"
  ON public.options FOR SELECT
  USING (true);

CREATE POLICY "options_insert_owner"
  ON public.options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "options_update_owner"
  ON public.options FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );

CREATE POLICY "options_delete_owner"
  ON public.options FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );


-- 2-4. votes -----------------------------------------------------------------
-- ★ 블라인드 룰의 핵심: 본인 투표만 SELECT/INSERT 가능. 타인의 투표는 절대 보이지 않음.
DROP POLICY IF EXISTS "votes_select_self"      ON public.votes;
DROP POLICY IF EXISTS "votes_insert_self"      ON public.votes;

CREATE POLICY "votes_select_self"
  ON public.votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "votes_insert_self"
  ON public.votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id
        AND p.status = 'active'
        AND p.expires_at > now()
    )
    AND EXISTS (
      SELECT 1 FROM public.options o
      WHERE o.id = option_id AND o.post_id = post_id
    )
  );

-- 본인 투표 변경/삭제는 허용하지 않음 (UPDATE / DELETE 정책 미생성 = 차단)


-- ============================================================================
-- 3. TRIGGERS / FUNCTIONS
-- ============================================================================

-- 3-1. auth.users → public.users 자동 생성 ------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nickname text;
BEGIN
  -- 우선순위: raw_user_meta_data.nickname > raw_user_meta_data.full_name > email 앞부분
  v_nickname := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'nickname', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
    split_part(COALESCE(NEW.email, 'user'), '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  INSERT INTO public.users (id, nickname, avatar_url)
  VALUES (
    NEW.id,
    v_nickname,
    NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();


-- 3-2. 솔로몬 지수 갱신 트리거 ------------------------------------------------
-- posts.status: 'active' → 'closed' 로 바뀌면
--   1) 각 option vote_count 집계
--   2) 최다 득표 option_id 선정 (동점 시 가장 먼저 만들어진 option_order)
--   3) 해당 option 투표자: majority_matched_votes + 1
--   4) 게시글 모든 투표자: total_votes + 1
CREATE OR REPLACE FUNCTION public.handle_post_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_winner_option_id uuid;
BEGIN
  -- 'active' → 'closed' 전이일 때만 동작
  IF NOT (OLD.status = 'active' AND NEW.status = 'closed') THEN
    RETURN NEW;
  END IF;

  -- 1) & 2) 최다 득표 option 결정 (동점 시 option_order 작은 쪽)
  SELECT o.id
    INTO v_winner_option_id
  FROM public.options o
  LEFT JOIN public.votes v ON v.option_id = o.id
  WHERE o.post_id = NEW.id
  GROUP BY o.id, o.option_order
  ORDER BY COUNT(v.id) DESC, o.option_order ASC
  LIMIT 1;

  -- 4) 모든 투표 참여자: total_votes + 1
  UPDATE public.users u
     SET total_votes = u.total_votes + 1
   WHERE u.id IN (SELECT v.user_id FROM public.votes v WHERE v.post_id = NEW.id);

  -- 3) 1위 option 투표자: majority_matched_votes + 1
  IF v_winner_option_id IS NOT NULL THEN
    UPDATE public.users u
       SET majority_matched_votes = u.majority_matched_votes + 1
     WHERE u.id IN (
       SELECT v.user_id FROM public.votes v WHERE v.option_id = v_winner_option_id
     );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_closed ON public.posts;
CREATE TRIGGER on_post_closed
  AFTER UPDATE OF status ON public.posts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_post_closed();


-- ============================================================================
-- 4. RPC / 헬퍼 함수
-- ============================================================================

-- 4-1. expires_at 도래한 active 게시글을 일괄 closed 처리
-- (Supabase Scheduled Function / cron 으로 호출)
CREATE OR REPLACE FUNCTION public.close_expired_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH updated AS (
    UPDATE public.posts
       SET status = 'closed'
     WHERE status = 'active'
       AND expires_at <= now()
     RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM updated;
  RETURN v_count;
END;
$$;


-- 4-2. 게시글 결과 집계 (expires_at 이후에만 호출 가능)
-- ★ 블라인드 룰 강제: expires_at 이전이면 권한 에러
CREATE OR REPLACE FUNCTION public.get_post_results(p_post_id uuid)
RETURNS TABLE (
  option_id    uuid,
  option_text  text,
  option_order integer,
  vote_count   bigint,
  is_winner    boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamptz;
  v_status     text;
BEGIN
  SELECT p.expires_at, p.status
    INTO v_expires_at, v_status
  FROM public.posts p
  WHERE p.id = p_post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_expires_at > now() AND v_status = 'active' THEN
    RAISE EXCEPTION 'blind rule: results are not available before expires_at'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH counts AS (
    SELECT
      o.id            AS option_id,
      o.option_text,
      o.option_order,
      COUNT(v.id)::bigint AS vote_count
    FROM public.options o
    LEFT JOIN public.votes v ON v.option_id = o.id
    WHERE o.post_id = p_post_id
    GROUP BY o.id, o.option_text, o.option_order
  ),
  winner AS (
    SELECT counts.option_id
      FROM counts
     ORDER BY counts.vote_count DESC, counts.option_order ASC
     LIMIT 1
  )
  SELECT
    c.option_id,
    c.option_text,
    c.option_order,
    c.vote_count,
    (c.option_id = (SELECT option_id FROM winner)) AS is_winner
  FROM counts c
  ORDER BY c.option_order ASC;
END;
$$;


-- 4-3. 솔로몬 지수 조회 함수 -------------------------------------------------
-- 반환: ratio(0~100), title, total_votes, matched
CREATE OR REPLACE FUNCTION public.get_user_solomon_index(p_user_id uuid)
RETURNS TABLE (
  user_id      uuid,
  total_votes  integer,
  matched      integer,
  ratio        numeric,
  title        text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total   integer;
  v_matched integer;
  v_ratio   numeric;
  v_title   text;
BEGIN
  SELECT u.total_votes, u.majority_matched_votes
    INTO v_total, v_matched
  FROM public.users u
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002';
  END IF;

  v_ratio := CASE
    WHEN v_total > 0 THEN ROUND((v_matched::numeric / v_total::numeric) * 100, 1)
    ELSE 0
  END;

  v_title := CASE
    WHEN v_total = 0     THEN '🌱 새내기 시민'
    WHEN v_ratio >= 90   THEN '👑 진정한 솔로몬'
    WHEN v_ratio >= 70   THEN '⚖️ 현명한 판단자'
    WHEN v_ratio >= 50   THEN '🤔 고민하는 시민'
    WHEN v_ratio >= 30   THEN '🌊 역류하는 물고기'
    ELSE                      '🎸 마이웨이 힙스터'
  END;

  RETURN QUERY SELECT p_user_id, v_total, v_matched, v_ratio, v_title;
END;
$$;


-- 4-4. 권한 부여 ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_post_results(uuid)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_solomon_index(uuid)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_expired_posts()         TO service_role;
