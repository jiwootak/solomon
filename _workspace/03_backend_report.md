# Phase 1 — Backend Report (DB & Auth Setup)

작성일: 2026-05-08
담당: solomon-backend

---

## 1. 생성/수정 파일 목록

| # | 경로 | 종류 | 설명 |
|---|------|------|------|
| 1 | `supabase/schema.sql` | DDL/RLS/트리거 | 전체 스키마(테이블 4 + 함수 3 + 트리거 2) |
| 2 | `types/solomon.ts` | TS 타입 | 도메인 타입 + `Database` 매핑 + 유틸 함수 |
| 3 | `lib/supabase/client.ts` | TS | 브라우저용 `createBrowserClient` 래퍼 |
| 4 | `lib/supabase/server.ts` | TS | 서버 컴포넌트/Action용 쿠키 기반 클라이언트 |
| 5 | `lib/supabase/middleware.ts` | TS | `updateSession()` 토큰 회전 유틸 |
| 6 | `middleware.ts` | TS | Next.js 14 인증 미들웨어 (보호 라우트 가드) |
| 7 | `lib/utils.ts` | TS | `cn()` + `formatRemaining()` 유틸 |
| 8 | `.env.local.example` | env | 환경변수 템플릿 |

> 모든 경로는 `/Users/wootak/git/solomon/` 기준.

---

## 2. 주요 테이블 스키마 요약

### 2-1. `public.users` — auth.users 와 1:1 매핑 프로필
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK | `auth.users(id)` 참조, ON DELETE CASCADE |
| nickname | text NOT NULL | 트리거가 email 앞부분으로 자동 생성 |
| avatar_url | text | nullable |
| total_votes | integer DEFAULT 0 | 종료된 게시글에 참여한 횟수 |
| majority_matched_votes | integer DEFAULT 0 | 본인이 1위(솔로몬의 선택)였던 횟수 |
| created_at | timestamptz DEFAULT now() | |

### 2-2. `public.posts`
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid | `users(id)` 참조 |
| content | text NOT NULL | |
| image_url | text | nullable |
| created_at | timestamptz | |
| **expires_at** | timestamptz | DEFAULT `now() + INTERVAL '24 hours'` |
| **status** | text | `active` \| `closed` (CHECK 제약) |

인덱스: `status`, `expires_at`, `user_id`

### 2-3. `public.options`
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK | |
| post_id | uuid | `posts(id)` 참조, ON DELETE CASCADE |
| option_text | text | |
| option_order | integer | UNIQUE(post_id, option_order) |

### 2-4. `public.votes` — 1인 1게시글 1회
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK | |
| post_id | uuid | |
| option_id | uuid | |
| user_id | uuid | |
| created_at | timestamptz | |

핵심 제약: **`UNIQUE(post_id, user_id)`**

---

## 3. RLS 정책 목록

| 테이블 | 정책 | 동작 | 조건 |
|--------|------|------|------|
| users | `users_select_all` | SELECT | 모두 허용 (프로필 공개) |
| users | `users_insert_self` | INSERT | `auth.uid() = id` |
| users | `users_update_self` | UPDATE | `auth.uid() = id` |
| posts | `posts_select_all` | SELECT | 모두 허용 (블라인드는 votes 단계에서 강제) |
| posts | `posts_insert_auth` | INSERT | `auth.uid() = user_id` |
| posts | `posts_update_owner` | UPDATE | 본인 게시글만 |
| posts | `posts_delete_owner` | DELETE | 본인 게시글만 |
| options | `options_select_all` | SELECT | 모두 허용 |
| options | `options_insert_owner` | INSERT | 자신의 post 에만 |
| options | `options_update_owner` | UPDATE | 자신의 post 에만 |
| options | `options_delete_owner` | DELETE | 자신의 post 에만 |
| **votes** | `votes_select_self` | SELECT | **`auth.uid() = user_id`** — 타인 투표 절대 비공개 |
| **votes** | `votes_insert_self` | INSERT | 본인 + active + `expires_at > now()` 검증 |
| votes | (UPDATE/DELETE) | (없음) | 정책 미생성 = 차단 |

### 블라인드 룰 강제 지점
1. **`votes_select_self` 정책** — 타인의 투표 row 자체를 볼 수 없으므로 `count` 집계 불가.
2. **`get_post_results()` RPC** — `expires_at > now() AND status='active'` 일 때 `42501` 권한 에러 raise.
3. (프론트엔드 보조) — `isExpired()` 판정 후 RPC 호출 분기.

---

## 4. 트리거/함수 동작 설명

### 4-1. `on_auth_user_created` — 회원가입 자동 프로필 생성
- **트리거 시점**: `AFTER INSERT ON auth.users`
- **함수**: `handle_new_auth_user()` (SECURITY DEFINER)
- **닉네임 우선순위**:
  1. `raw_user_meta_data.nickname`
  2. `raw_user_meta_data.full_name` (Google OAuth)
  3. `raw_user_meta_data.name`
  4. `email` 의 `@` 앞부분
  5. fallback: `user_<uuid 앞 8자>`
- **avatar_url**: `raw_user_meta_data.avatar_url` (Google 프로필 이미지) 자동 매핑.

### 4-2. `on_post_closed` — 솔로몬 지수 갱신
- **트리거 시점**: `AFTER UPDATE OF status ON public.posts WHEN (OLD.status IS DISTINCT FROM NEW.status)`
- **함수**: `handle_post_closed()` (SECURITY DEFINER)
- **로직**:
  1. `'active' → 'closed'` 전이일 때만 동작 (다른 전이는 즉시 RETURN).
  2. 해당 post 의 option 별 vote_count 집계 → `COUNT(v.id) DESC, option_order ASC` 로 1위 결정 (동점 시 먼저 만들어진 선택지 우선).
  3. 게시글 모든 투표 참여자: `users.total_votes += 1`.
  4. 1위 option 투표자: `users.majority_matched_votes += 1`.
- **재귀 방지**: `posts` 가 아닌 `users` 만 UPDATE 하므로 트리거 재진입 없음.
- **투표가 0건인 경우**: `v_winner_option_id IS NULL` → `total_votes` 증가도 발생하지 않음 (`UPDATE … WHERE u.id IN (…)` 가 빈 집합).

### 4-3. `close_expired_posts()` — 만료 일괄 처리
- **권한**: `service_role` 만 EXECUTE.
- **사용처**: Supabase Scheduled Functions 또는 Vercel Cron 으로 1분 간격 호출.
- **반환**: closed 처리된 게시글 수.

### 4-4. `get_post_results(p_post_id)` — 결과 집계 RPC
- **권한**: `anon`, `authenticated` 모두 EXECUTE 가능 — 단, 함수 내에서 `expires_at` 강제 검증.
- **반환 컬럼**: `option_id, option_text, option_order, vote_count, is_winner`.
- **블라인드 위반 시**: SQLSTATE `42501` raise.

### 4-5. `get_user_solomon_index(p_user_id)` — 솔로몬 지수 조회
- **반환**: `user_id, total_votes, matched, ratio(0~100), title`.
- **칭호 매핑**: AGENTS.md 의 5단계 그대로. `total_votes = 0` 이면 별도 칭호 `🌱 새내기 시민`.

---

## 5. Supabase SQL Editor 에서 실행할 사항

### 초기 셋업 순서
1. **Project Settings → Database → Extensions**
   - `pgcrypto` 활성화 (스키마에서 `CREATE EXTENSION IF NOT EXISTS` 로 명시했지만 GUI 토글이 더 명확).
2. **SQL Editor → New Query → 전체 붙여넣기**
   - `supabase/schema.sql` 전체 실행.
3. **검증 쿼리** (선택)
   ```sql
   -- 정책 확인
   SELECT schemaname, tablename, policyname, cmd
     FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

   -- 트리거 확인
   SELECT tgname, tgrelid::regclass FROM pg_trigger
    WHERE tgname IN ('on_auth_user_created','on_post_closed');

   -- 함수 확인
   SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace
      AND proname IN ('handle_new_auth_user','handle_post_closed','close_expired_posts','get_post_results','get_user_solomon_index');
   ```

### Auth 설정
- **Authentication → Providers → Google** 활성화 (Client ID/Secret 등록).
- **URL Configuration**:
  - Site URL: `http://localhost:3000` (개발) / Vercel 도메인 (프로덕션)
  - Redirect URLs: `http://localhost:3000/auth/callback`, `https://<vercel-domain>/auth/callback`
- **Email Provider**: Email/Password 활성화 (이메일 회원가입 요구사항).

### Storage (이미지 업로드용)
- 게시글 이미지를 Supabase Storage 에 올리려면 별도 버킷 생성:
  ```sql
  -- (별도 마이그레이션) 게시글 이미지 버킷
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('post-images', 'post-images', true)
  ON CONFLICT (id) DO NOTHING;
  ```
  RLS 정책은 다음 phase 에서 추가 (현재 Phase 1 범위 외).

### Scheduled Function (24h 자동 마감)
- `pg_cron` 활성화 후:
  ```sql
  SELECT cron.schedule('close-expired-posts', '* * * * *',
    $$SELECT public.close_expired_posts();$$);
  ```
- 또는 Vercel Cron 으로 `/api/cron/close-expired` 라우트(차후 phase) 1분 간격 호출.

---

## 6. 의존성 추가 필요

### `package.json` 추가 필요 패키지
```json
"dependencies": {
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.4"
}
```

설치 명령:
```bash
npm i clsx tailwind-merge
```

> `npx tsc --noEmit` 결과 — `lib/utils.ts` 의 `clsx` / `tailwind-merge` 미설치 에러 2건만 발생. 그 외 모든 백엔드 코드/타입은 컴파일 통과.

---

## 7. 다음 Phase 인수인계 (frontend / pm)

### 프론트엔드에서 사용 가능한 API 표면
| 호출 | 위치 | 용도 |
|------|------|------|
| `createClient()` | `@/lib/supabase/client` | 클라이언트 컴포넌트 |
| `await createClient()` | `@/lib/supabase/server` | 서버 컴포넌트 / Server Action |
| `supabase.rpc('get_post_results', { p_post_id })` | RPC | 결과 공개 (블라인드 자동 검증) |
| `supabase.rpc('get_user_solomon_index', { p_user_id })` | RPC | 프로필 솔로몬 지수 |
| `supabase.from('posts').insert(...)` | Table | 게시글 생성 (RLS 자동 검증) |
| `supabase.from('votes').insert(...)` | Table | 투표 (RLS 가 active/expires_at 검증) |

### 타입 임포트
```ts
import type {
  User, Post, Option, Vote,
  PostWithOptions, PostResult, SolomonIndex,
} from "@/types/solomon";
import { isExpired, remainingMs, getTitleByIndex, calcSolomonIndex } from "@/types/solomon";
```

### 미들웨어 동작
- 보호 라우트: `/post/create`, `/my` (그리고 그 하위 경로) — 비로그인 시 `/login?redirect=...` 로 리다이렉트.
- 모든 요청에서 Supabase 토큰 자동 회전.

### 다음 Phase 권장 작업
1. `app/api/auth/callback/route.ts` — OAuth code 교환 라우트.
2. `app/(auth)/login`, `app/(auth)/register` 페이지 + Google OAuth 버튼.
3. 게시글 작성 Server Action (`app/post/create/actions.ts`).
4. Storage 버킷 RLS 정책 추가 (이미지 업로드 시).
5. Vercel Cron 또는 pg_cron 로 `close_expired_posts()` 스케줄링.

---

## 8. 보안 체크리스트

- [x] RLS 모든 테이블 ENABLE
- [x] `votes` SELECT 는 본인 row 만 — 타인 투표 비공개 (블라인드 룰)
- [x] `get_post_results()` 에서 expires_at 이중 검증
- [x] votes INSERT 정책에 `status='active' AND expires_at > now()` 강제
- [x] 트리거 재귀 방지 (status 컬럼만 감지하는 `OF status` + 별도 테이블 UPDATE)
- [x] SECURITY DEFINER 함수에 `search_path = public` 명시 (search_path injection 방어)
- [x] `service_role` 전용 함수(`close_expired_posts`)에 `anon/authenticated` GRANT 차단
- [ ] (다음 Phase) Storage 버킷 RLS — 이미지 업로드 시 본인 게시글 검증
- [ ] (다음 Phase) Rate limiting — 게시글 폭주 방지 (Supabase 자체 또는 Edge Function)


---

# Phase 3 API — 투표/게시글 라우트 (`app/api/`)

작성일: 2026-05-08
담당: solomon-backend (Phase 3)

## 9. 신규 추가/수정 파일

| # | 경로 | 종류 | 설명 |
|---|------|------|------|
| 1 | `app/api/vote/route.ts` | API | POST: 투표 생성 |
| 2 | `app/api/posts/route.ts` | API | GET: 피드 목록 / POST: 게시글 작성 |
| 3 | `app/api/posts/[id]/route.ts` | API | GET: 게시글 상세 (블라인드 분기) |
| 4 | `app/api/posts/[id]/close/route.ts` | API | POST: 수동 종료 |
| 5 | `lib/solomon.ts` | 유틸 | 서버용 솔로몬 지수 계산기 |
| 6 | `types/solomon.ts` | 타입 | `Database` 타입을 `supabase-js@2.105` 호환 형태로 보강 (`Relationships`, `Views`, `Enums`, `CompositeTypes` 추가, Row/Insert/Update 인라인 객체 형태) |

> 검증: `npx tsc --noEmit` 0 에러.

---

## 10. API 엔드포인트 스펙

### 10-1. `POST /api/vote`
투표 생성. 1인 1게시글 1회.

**Request Body**
```json
{ "post_id": "uuid", "option_id": "uuid" }
```

**Responses**
| Status | Body | 사유 |
|--------|------|------|
| 201 | `{ "success": true, "vote_id": "uuid" }` | 정상 |
| 400 | `{ "error": "요청 본문이 올바른 JSON 이 아닙니다." }` | JSON 파싱 실패 |
| 400 | `{ "error": "post_id / option_id 가 올바르지 않습니다." }` | UUID 형식 실패 |
| 400 | `{ "error": "투표가 종료되었습니다." }` | `status='closed'` 또는 `expires_at <= now()` |
| 400 | `{ "error": "선택지가 올바르지 않습니다." }` | option 이 다른 post 소속 |
| 400 | `{ "error": "이미 투표하셨습니다." }` | UNIQUE(post_id, user_id) 위반 / 중복 |
| 401 | `{ "error": "로그인이 필요합니다." }` | 비인증 |
| 404 | `{ "error": "게시글을 찾을 수 없습니다." }` | post not found |
| 500 | `{ "error": "..." }` | DB 오류 |

**검증 순서**: 인증 → UUID 형식 → post 존재/만료 → option 소속 → 중복 투표 → INSERT (RLS 재검증).

---

### 10-2. `GET /api/posts`
피드 목록. **블라인드 룰: vote_count 절대 미포함.**

**Query**
- `status`: `active` | `closed` (생략 시 전체)
- `page`: 1-indexed (기본 1)
- `limit`: 1~50 (기본 20)

**Response 200**
```json
{
  "posts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "content": "string",
      "image_url": "string | null",
      "created_at": "ISO8601",
      "expires_at": "ISO8601",
      "status": "active | closed",
      "options": [
        { "id": "uuid", "post_id": "uuid", "option_text": "string", "option_order": 1, "created_at": "ISO8601" }
      ],
      "author": { "id": "uuid", "nickname": "string", "avatar_url": "string | null" },
      "my_vote": { "option_id": "uuid" } | null
    }
  ],
  "total": 123,
  "page": 1,
  "limit": 20
}
```

> `options` 배열에 `vote_count` 키가 **존재하지 않음** (active/closed 무관). 결과는 상세(`/api/posts/[id]`) 에서만 노출.

---

### 10-3. `POST /api/posts`
게시글 작성.

**Request Body**
```json
{
  "content": "string (1~500자)",
  "options": ["string", "string", "..."],   // 2~4개, 각 80자 이내, 중복 불가
  "image_url": "string | null"               // optional
}
```

**Responses**
| Status | Body |
|--------|------|
| 201 | `{ "post": Post, "options": Option[] }` |
| 400 | `{ "error": "..." }` (content/options 검증 실패) |
| 401 | `{ "error": "로그인이 필요합니다." }` |
| 500 | `{ "error": "..." }` (DB 오류 시 post 보상 삭제 시도) |

`expires_at` 은 `posts` DEFAULT (`now() + INTERVAL '24 hours'`) 로 자동 설정.

---

### 10-4. `GET /api/posts/[id]`
게시글 상세. **블라인드 룰 분기점.**

**Response 200 — 진행중 (`status='active' && expires_at > now()`)**
```json
{
  "post": { "id": "...", "status": "active", "expires_at": "...", "..." : "..." },
  "author": { "id": "...", "nickname": "...", "avatar_url": null },
  "options": [
    { "id": "...", "option_text": "...", "option_order": 1, "..." : "..." }
  ],
  "user_vote_option_id": "uuid | null"
}
```
> `vote_count` 키가 **각 option 객체에 존재하지 않음**. `solomon_choice` 키도 응답에 없음.

**Response 200 — 종료됨 (`status='closed' || expires_at <= now()`)**
```json
{
  "post": { "...": "..." },
  "author": { "...": "..." },
  "options": [
    { "id": "...", "option_text": "...", "option_order": 1, "vote_count": 12, "...": "..." }
  ],
  "user_vote_option_id": "uuid | null",
  "solomon_choice": "uuid"
}
```
> `solomon_choice` 는 `get_post_results()` RPC 가 반환한 `is_winner=true` option_id (동점 시 `option_order` 작은 쪽).

**오류**
| Status | 사유 |
|--------|------|
| 400 | UUID 형식 실패 |
| 404 | post 없음 |
| 500 | DB 오류 |

> RPC 호출이 실패하면 안전하게 `vote_count` 미포함 응답으로 폴백 (블라인드 룰 위반보다 빈 응답 우선).

---

### 10-5. `POST /api/posts/[id]/close`
게시글 수동 종료. 작성자 본인 + `expires_at <= now()` 일 때만 가능.

**Response**
| Status | Body |
|--------|------|
| 200 | `{ "success": true }` 또는 `{ "success": true, "already_closed": true }` |
| 400 | `{ "error": "post id 가 올바르지 않습니다." }` / `{ "error": "아직 종료할 수 없습니다. (24시간 경과 필요)" }` |
| 401 | `{ "error": "로그인이 필요합니다." }` |
| 403 | `{ "error": "본인의 게시글만 종료할 수 있습니다." }` |
| 404 | `{ "error": "게시글을 찾을 수 없습니다." }` |
| 500 | `{ "error": "..." }` |

**부수 효과**: `posts.status = 'closed'` UPDATE → `on_post_closed` 트리거 발동 →
- 모든 투표자의 `users.total_votes += 1`
- 1위 option 투표자의 `users.majority_matched_votes += 1`

**자동 종료 운영 옵션 (코드 주석 동기화)**
- (a) Supabase `pg_cron`:
  ```sql
  SELECT cron.schedule('close-expired', '* * * * *',
    $$SELECT public.close_expired_posts();$$);
  ```
- (b) Vercel Cron + 별도 라우트(차후 추가):
  ```json
  // vercel.json
  { "crons": [{ "path": "/api/cron/close-expired", "schedule": "* * * * *" }] }
  ```

---

## 11. 블라인드 룰 적용 위치 (다층 방어)

| 레이어 | 위치 | 동작 |
|--------|------|------|
| DB RLS | `votes_select_self` | 타인 투표 row 자체를 SELECT 불가 → COUNT 집계 차단 |
| DB RPC | `get_post_results()` | `expires_at > now() AND status='active'` 시 `42501` raise |
| API GET 피드 | `app/api/posts/route.ts` | options SELECT 절에 `vote_count` 컬럼 자체를 포함하지 않음 |
| API GET 상세 | `app/api/posts/[id]/route.ts` | `isExpired()` 분기 → 진행중이면 `vote_count` 키 자체를 응답 객체에 추가하지 않음 (`solomon_choice` 키도 없음) |
| API POST 투표 | `app/api/vote/route.ts` | 응답에 `success / vote_id` 만 — 다른 사람 투표 정보 일체 미포함 |

---

## 12. 보안 검증 체크포인트

- [x] **인증**: 모든 mutation 라우트 (POST /api/vote, POST /api/posts, POST /api/posts/[id]/close) 에서 `supabase.auth.getUser()` 결과 검증 후 401 분기.
- [x] **소유권**: `POST /api/posts/[id]/close` — `post.user_id !== user.id` 시 403.
- [x] **입력 검증**:
  - UUID 정규식 (`UUID_RE`) 으로 path/body 파라미터 검증.
  - content: trim 후 1~500자, options: 2~4개 / 각 80자 / 중복 불가.
  - JSON.parse 실패 시 400.
- [x] **race condition 방어**:
  - `votes` UNIQUE(post_id, user_id) → INSERT 실패 시 `23505` → "이미 투표하셨습니다".
  - close 라우트 UPDATE WHERE `status='active'` → 동시 close 시 no-op.
- [x] **블라인드 룰**: 위 11번 표 5개 레이어 — RLS / RPC / API 응답 모두 차단.
- [x] **트리거 의존**: `on_post_closed` 가 솔로몬 지수 갱신을 담당하므로 API 에서 `users.total_votes` 직접 UPDATE 하지 않음 (이중 가산 방지).
- [x] **정보 누설 방지**: 에러 메시지에 DB schema 정보 포함하지 않음 (한국어 일반화).
- [ ] (다음 Phase 권장) Rate limit — 동일 user 의 POST /api/posts 분당 호출 제한.
- [ ] (다음 Phase 권장) CSRF — Next.js Route Handler 는 same-origin 기본이지만, 외부 origin 차단 헤더 검사 옵션 추가.

---

## 13. 솔로몬 지수 계산 유틸 (`lib/solomon.ts`)

`schema.sql` 의 `get_user_solomon_index()` RPC 와 1:1 동기화.

```ts
calculateSolomonIndex(totalVotes, matchedVotes): number   // 0~100, 소수점 1자리
getTitleByIndex(index): string                            // 5단계 칭호
getSolomonData(user): SolomonIndex                        // { user_id, total_votes, matched, index, title }
```

칭호 기준 (AGENTS.md 와 동일):
- `total_votes === 0` → `🌱 새내기 시민` (calling site 에서 `getSolomonData()` 가 자동 처리)
- `90+` → 👑 진정한 솔로몬
- `70~89` → ⚖️ 현명한 판단자
- `50~69` → 🤔 고민하는 시민
- `30~49` → 🌊 역류하는 물고기
- `~29` → 🎸 마이웨이 힙스터

---

## 14. 프론트엔드 인수인계 메모

### API 호출 예시 (클라이언트)
```ts
// 투표
const res = await fetch("/api/vote", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ post_id, option_id }),
});

// 피드
const feed = await fetch("/api/posts?status=active&page=1&limit=20").then(r => r.json());

// 상세
const detail = await fetch(`/api/posts/${id}`).then(r => r.json());
const isExpired = detail.solomon_choice !== undefined;  // ★ 결과 공개 여부 판정

// 종료
await fetch(`/api/posts/${id}/close`, { method: "POST" });
```

### 주의사항
1. **`vote_count` 가 응답에 없으면 진행중**: 클라이언트는 `solomon_choice` 또는 `options[i].vote_count` 의 존재로 결과 공개 여부를 판단해도 되지만, 권장은 `isExpired(post)` 유틸 (status/expires_at 기반).
2. **낙관적 업데이트**: 투표 직후 `my_vote` 만 업데이트하고, 결과는 `expires_at` 까지 표시 금지.
3. **에러 핸들링**: 401 → 로그인 페이지, 400 → toast.error(body.error), 500 → "잠시 후 다시 시도해주세요".
