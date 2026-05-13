# Phase 2 — Frontend Report (Core UI & Layout)

작성일: 2026-05-08
담당: solomon-frontend
상태: 완료 (tsc --noEmit 통과)

---

## 1. 생성/수정 파일 목록

| # | 경로 | 종류 | 신규/수정 | 설명 |
|---|------|------|-----------|------|
| 1 | `app/globals.css` | CSS | 수정 | 인디고 주조색 + 슬레이트 배경, `pb-16` 예약, `.container-mobile` 유틸 |
| 2 | `app/layout.tsx` | TSX | 수정 | "모두의 솔로몬" 메타, PWA `theme-color`/`manifest`, `<BottomNav/>` 마운트, Toaster import 주석 처리 |
| 3 | `app/page.tsx` | TSX | 수정 | 홈 피드 Server Component (active/closed 분리 fetch) + 데모 fallback |
| 4 | `app/(auth)/login/page.tsx` | TSX | 신규 | Google OAuth + 이메일 로그인 폼, 환경변수 미설정 시 안내 |
| 5 | `app/(auth)/register/page.tsx` | TSX | 신규 | 닉네임/이메일/비번 회원가입, 인증 메일 안내 |
| 6 | `app/api/auth/callback/route.ts` | TS | 신규 | OAuth `exchangeCodeForSession` 처리 + 안전 리다이렉트 |
| 7 | `components/BottomNav.tsx` | TSX | 신규 | 하단 3탭 네비게이션, 중앙 작성 버튼 강조, `/login` `/register` 에서 자동 숨김 |
| 8 | `components/feed/FeedTabs.tsx` | TSX | 신규 | 진행중/종료됨 탭, Framer Motion `layoutId` 인디케이터 |
| 9 | `components/feed/PostCard.tsx` | TSX | 신규 | 카드 렌더링, **블라인드 룰 엄수**, 진행중/종료 분기, 카운트다운 |
| 10 | `components/feed/FeedView.tsx` | TSX | 신규 | (보조) 클라이언트 측 탭 상태 + AnimatePresence 전환, 빈 상태 |
| 11 | `public/manifest.json` | JSON | 신규 | PWA 매니페스트 (아이콘은 Phase 3 에서 채울 예정) |

> 모든 경로는 `/Users/wootak/git/solomon/` 기준.

---

## 2. 컴포넌트 의존성 트리

```
app/layout.tsx
├── app/globals.css
└── components/BottomNav.tsx                (client) — usePathname()
    └── lib/utils.ts (cn)

app/page.tsx                                 (server)
└── lib/supabase/server.ts (createClient)    — Supabase 미설정 시 DEMO 데이터로 fallback
└── components/feed/FeedView.tsx            (client)
    ├── components/feed/FeedTabs.tsx        (client) — framer-motion layoutId
    └── components/feed/PostCard.tsx        (client)
        ├── types/solomon.ts (isExpired, remainingMs)
        ├── lib/utils.ts (cn, formatRemaining)
        └── framer-motion (motion.div)

app/(auth)/login/page.tsx                    (client)
└── lib/supabase/client.ts (createClient)
    ├── auth.signInWithPassword
    └── auth.signInWithOAuth({ provider: "google" })
        → /api/auth/callback?code=...

app/(auth)/register/page.tsx                 (client)
└── auth.signUp({ options: { data: { nickname }, emailRedirectTo } })

app/api/auth/callback/route.ts               (server route)
└── lib/supabase/server.ts (createClient)
    └── auth.exchangeCodeForSession(code)
```

### 데이터 흐름 — 홈 피드
```
Server: app/page.tsx
  ├── env 확인 → 미설정이면 DEMO_ACTIVE / DEMO_CLOSED 반환 (isDemo=true)
  ├── 설정됨 → posts.select(active + options) + posts.select(closed + options)
  │           ※ vote_count 절대 select 안 함 (블라인드 룰)
  └── normalize() → PostWithOptions[]
       └─→ FeedView (client) ─ tab state ─→ PostCard[]
```

---

## 3. 주요 디자인 결정 사항

### 3-1. 컬러 팔레트 (AGENTS.md 준수)
- **인디고 600 (#4F46E5)** — 주조색: 활성 탭, CTA 버튼, 작성 버튼 배경
- **앰버 50/200/700/900** — "솔로몬의 선택" 강조 카드 (종료된 게시글)
- **슬레이트 50** — body 배경 / **슬레이트 900** — 본문 텍스트
- **에메랄드 600** — "내 선택이 솔로몬과 일치" 보조 메시지

### 3-2. 블라인드 룰 (가장 중요)
- `app/page.tsx` 의 `posts.select()` 쿼리에서 **`vote_count` / `votes(count)` 형태를 절대 포함하지 않음**.
- `PostCard` 의 진행중 영역(`ActiveFooter`)은 카운트다운 + 선택지 개수만 노출.
- 종료된 카드(`ClosedFooter`)도 `vote_count` 가 옵션에 채워져 있을 때만 1위를 표시 — 즉 RPC `get_post_results` 결과를 별도 주입했을 때만. 피드 단계에서는 보통 "결과 확인하러 가기" 안내만 보임 → 상세 페이지에서 RPC 호출하도록 Phase 3 에 위임.
- `isExpired(post)` 헬퍼로 일관 분기 (status='closed' OR expires_at <= now).

### 3-3. 모바일 우선 + PWA
- `body { padding-bottom: 4rem }` — 하단 네비게이션 64px 영역 침범 방지.
- `.container-mobile` — `max-w-lg` 중앙 정렬 (32rem = 512px).
- `viewport.themeColor = "#4F46E5"` — 모바일 브라우저 상단 바 색상.
- `safe-bottom` 유틸 — iOS 홈 인디케이터 영역 보정.

### 3-4. 라이브러리 미사용 결정
- **lucide-react 미설치** → BottomNav, PostCard 의 아이콘은 모두 인라인 SVG (Lucide 스타일 stroke=2 라운드 라인 + viewBox 24).
- **sonner 미설치** → `app/layout.tsx` 의 `<Toaster />` import 주석 처리, 본 단계에서는 폼 에러를 모두 인라인 메시지(`<p class="bg-red-50">`)로 표현.

### 3-5. Framer Motion 활용 위치
- `PostCard` 등장 — `initial { opacity: 0, y: 20 }` + `delay: index * 0.04` (최대 6) — 스태거 효과.
- `FeedTabs` 인디케이터 — `layoutId="feed-tab-underline"` + spring 380/30.
- `FeedView` 탭 전환 — `AnimatePresence mode="wait"` + 짧은 fade-up.

### 3-6. Supabase 미설정 대응 (개발 UX)
- **로그인/회원가입**: 폼은 보이되 모든 input/button `disabled`, 상단에 환경변수 안내 박스 노출.
- **홈 피드**: 데모 게시글 3건 + "데모 모드" 배지 표시 → UI 결과를 환경변수 없이도 확인 가능.

---

## 4. 검증 결과

```bash
$ npx tsc --noEmit
# 종료코드 0 — 전체 컴파일 통과
```

빌드/런타임 검증은 Phase 4 (QA) 에서 수행 예정.

---

## 5. Phase 3 인수인계 (다음 작업)

### 5-1. 즉시 필요한 패키지 설치
```bash
npm i lucide-react sonner
```
설치 후 작업:
- `app/layout.tsx` 의 `<Toaster />` import 주석 해제.
- BottomNav / PostCard 의 인라인 SVG 를 `lucide-react` 의 `Home`, `Pencil`, `User`, `Clock` 으로 교체할 수 있음 (선택).

### 5-2. 미구현 페이지 (Phase 3 범위)
| 라우트 | 설명 | 필요 작업 |
|--------|------|----------|
| `/post/create` | 게시글 작성 | 본문 + 선택지 2~5개 동적 입력, Server Action |
| `/post/[id]` | 게시글 상세 + 투표 | 진행중: VoteButton, CountdownTimer / 종료: ResultBar (RPC `get_post_results`) |
| `/my` | 내 프로필 | 솔로몬 지수 표시, RPC `get_user_solomon_index` |
| `/profile/[id]` | 다른 사용자 프로필 | 동일 RPC, 본인이 쓴 글 목록 |

### 5-3. 컴포넌트 추가 권장
- `components/post/VoteButton.tsx` — 투표 처리 + 낙관적 업데이트 (`hooks/useVote.ts`).
- `components/post/CountdownTimer.tsx` — 큰 카운트다운 (PostCard 의 작은 것과 별도).
- `components/post/ResultBar.tsx` — `PostResult[]` 입력받아 가로 막대 + 1위 앰버 강조.
- `components/profile/SolomonIndex.tsx` — 도넛/게이지 + 칭호 (`getTitleByIndex`).
- `components/profile/TitleBadge.tsx` — 칭호만 인라인 표시.

### 5-4. 보강 권장 (옵션)
- `app/page.tsx` 의 종료된 피드 카드에서 1위 노출을 위해 N+1 RPC 호출 대신 별도 RPC `get_recent_closed_with_winner` 추가 검토 (백엔드 협업).
- `BottomNav` 의 "내 프로필" 활성 매칭 — 현재는 `/my` 또는 `/profile/*` 모두 활성. 필요 시 `/profile/me` 라우트로 통합.
- `manifest.json` 의 `icons` 배열 채우기 — 192/512 PNG 생성 후 `/public/icons/` 에 배치.

### 5-5. 미들웨어/proxy 인수인계
- 백엔드가 작성한 `middleware.ts` 의 `PROTECTED_PREFIXES = ["/post/create", "/my"]` 로 인해 비로그인 사용자는 작성/내프로필 접근 시 자동으로 `/login?redirect=...` 이동.
- 로그인 페이지의 `redirectTo = params.get("redirect") || "/"` 는 이 흐름을 받아서 처리함.

---

## 6. 주요 가정 사항 (협업 노트)

1. **백엔드 스키마**: `users` FK 제약 명이 `posts_user_id_fkey` 라고 가정 (Supabase 기본 명명). 다른 이름이면 `app/page.tsx` 의 `author:users!posts_user_id_fkey` 부분 조정 필요.
2. **OAuth 콜백 경로**: 백엔드 보고서의 권장(`/auth/callback`) 대신 **`/api/auth/callback`** 로 구현. 이유:
   - Next.js 14 App Router 의 Route Handler 컨벤션이 `app/api/.../route.ts` 임.
   - Supabase Dashboard → URL Configuration → Redirect URLs 에 `https://<domain>/api/auth/callback` 추가 필요.
   - 백엔드 보고서의 `/auth/callback` 안내는 Phase 3 에서 통일 또는 alias 처리 권장.
3. **`isExpired()` 동시성**: PostCard 의 `setInterval` 1초 갱신은 카드 단위 — 30개 동시 렌더링 시 30 timer. 필요 시 Phase 3 에서 단일 `now` context 로 최적화 가능 (현재는 가독성 우선).
4. **AGENTS.md 의 "Next.js 14"** 와 RepTrust 의 Next.js 16 설명은 별개임 — 본 프로젝트는 Next.js 14, `middleware.ts` 사용, `proxy.ts` 미사용.

---

# Phase 3 — Frontend Report (Vote UI + Hooks + Post Pages)

작성일: 2026-05-08
담당: solomon-frontend
상태: 완료 (`npx tsc --noEmit` 통과 — 출력 없음, exit 0)

## 3-1. Phase 3 에서 생성/수정된 파일

| # | 경로 | 종류 | 신규/수정 | 설명 |
|---|------|------|-----------|------|
| 1 | `app/layout.tsx` | TSX | 수정 | `sonner` `<Toaster position="top-center" richColors />` 활성화 (주석 해제) |
| 2 | `hooks/useCountdown.ts` | TS | 신규 | ISO 만료 → `{hours, minutes, seconds, days, expired, urgent, displayText}` 1초 갱신 훅, unmount cleanup |
| 3 | `hooks/useVote.ts` | TS | 신규 | 낙관적 업데이트 + 실패 롤백 투표 훅 (`vote`, `isVoting`, `userVoteOptionId`, `setUserVoteOptionId`) |
| 4 | `components/post/CountdownTimer.tsx` | TSX | 신규 | 큰 카운트다운 — 1h 미만 빨간색, 24h+ "X일 Y시간 Z분", 초 변경 시 scale 미세 애니메이션 |
| 5 | `components/post/VoteButton.tsx` | TSX | 신규 | 인디고 테두리 → 본인 선택 시 인디고 배경 + Check 아이콘, 다른 옵션 흐리게(`opacity-50`), `whileTap scale 0.97` |
| 6 | `components/post/ResultBar.tsx` | TSX | 신규 | 가로 막대 결과, 마운트 시 0 → 실제 width 1초 ease-out, 솔로몬의 선택은 앰버 + 👑, 본인 선택은 ring/badge |
| 7 | `app/post/[id]/page.tsx` | TSX | 신규 | 상세 페이지 — `GET /api/posts/{id}` fetch, 로딩 스켈레톤/에러(404)/진행중/종료 4가지 분기 |
| 8 | `app/post/create/page.tsx` | TSX | 신규 | 작성 폼 — content(최대 500자), 옵션 2~4 동적, 이미지 URL, `POST /api/posts` |
| 9 | `app/post/create/loading.tsx` | TSX | 신규 | 작성 페이지 라우트 전환 시 스켈레톤 |

> 모든 경로는 `/Users/wootak/git/solomon/` 기준.

## 3-2. 컴포넌트/훅 의존성

```
hooks/useCountdown.ts
└── (없음 — React 만)

hooks/useVote.ts
├── sonner (toast.success / toast.error)
└── fetch("/api/vote", POST)

components/post/CountdownTimer.tsx     (client)
├── hooks/useCountdown
├── lucide-react (Clock)
└── framer-motion (motion.span + AnimatePresence — 초 단위 micro scale)

components/post/VoteButton.tsx         (client)
├── lucide-react (Check)
└── framer-motion (motion.button whileTap)

components/post/ResultBar.tsx          (client)
└── framer-motion (motion.div width 0 → percent%)

app/post/[id]/page.tsx                 (client, "use client")
├── fetch GET /api/posts/{id}
├── components/post/CountdownTimer
├── components/post/VoteButton
├── components/post/ResultBar
├── hooks/useVote
└── types/solomon (isExpired)

app/post/create/page.tsx               (client, "use client")
├── lib/supabase/client (auth.getUser → /login redirect)
├── fetch POST /api/posts
├── sonner (toast)
└── framer-motion (AnimatePresence — 옵션 추가/제거)
```

## 3-3. API 계약 (백엔드와의 인터페이스)

Phase 3 는 다음 4개 백엔드 라우트를 가정하고 호출한다 — **아직 미구현일 수 있으므로 Phase 4(Backend) 에서 추가 필요**.

### `GET /api/posts/{id}` — 게시글 상세
```jsonc
// 진행중(블라인드) 응답
{
  "post": {
    "id": "uuid",
    "user_id": "uuid",
    "content": "...",
    "image_url": null,
    "created_at": "...",
    "expires_at": "...",
    "status": "active",
    "author": { "id": "uuid", "nickname": "...", "avatar_url": null },
    "options": [
      // 진행중에는 vote_count 키 자체를 포함하지 않음 (블라인드 룰)
      { "id": "uuid", "post_id": "uuid", "option_text": "...", "option_order": 1, "created_at": "..." }
    ],
    "my_vote": { "option_id": "uuid" } | null
  }
}

// 종료 응답 (status='closed' 또는 expires_at <= now)
{
  "post": {
    /* ... */
    "status": "closed",
    "options": [
      { /* ..., */ "vote_count": 78 }
    ],
    "my_vote": { "option_id": "uuid" } | null
  },
  "solomon_choice_id": "uuid"  // 최다 득표 옵션 id
}
```
- 클라이언트는 404 응답 시 전용 에러 UI 표시.
- `solomon_choice_id` 가 없으면 클라이언트가 `vote_count` 기반으로 직접 계산(보조).

### `POST /api/vote` — 투표
```jsonc
// 요청
{ "post_id": "uuid", "option_id": "uuid" }

// 성공 응답
{ "ok": true }

// 실패 응답 (예: 이미 투표함, 만료됨, 인증 없음)
{ "error": "이미 투표한 게시글입니다" }
```
- 클라이언트는 응답 본문의 `error` 또는 `message` 필드를 toast 에 표시.

### `POST /api/posts` — 게시글 작성
```jsonc
// 요청
{
  "content": "...",
  "image_url": "https://..." | null,
  "options": [
    { "option_text": "...", "option_order": 1 },
    { "option_text": "...", "option_order": 2 }
  ]
}

// 성공 응답 — 둘 중 하나의 형태 허용
{ "post": { "id": "uuid" } }
// 또는
{ "id": "uuid" }
```
- 성공 시 클라이언트는 `/post/{id}` 로 즉시 이동.

> **백엔드 인수인계**: 위 3개 라우트는 Phase 1 에서 RLS/RPC 만 만들어진 상태이므로 Phase 4 에서 `app/api/posts/route.ts`, `app/api/posts/[id]/route.ts`, `app/api/vote/route.ts` 신규 작성 필요. RPC `get_post_results` 는 종료 분기에서 활용.

## 3-4. 블라인드 룰 준수 사항 (★중요)

1. **상세 페이지** (`app/post/[id]/page.tsx`)
   - `isExpired(post)` 가 `false` 면 `ResultBar` 를 절대 렌더하지 않음.
   - 진행중에는 `VoteButton` 들만 표시 + "결과는 24시간 후 공개됩니다" 안내.
   - 서버 응답에 진행중인데 `vote_count` 가 섞여 와도 UI 가 결과를 노출하지 않음 (분기 우선).

2. **VoteButton**
   - props 에 `vote_count` 를 받지 않음 — 본인 선택 표시(체크) 만 가능.

3. **ResultBar**
   - `expired === true` 분기에서만 마운트되도록 호출 측에서 가드.

4. **카운트다운**
   - `expires_at` 만 사용 — 득표 정보 무관.

## 3-5. 디자인 결정

### 색상/형태 (AGENTS.md 준수)
- **인디고 600** — 진행중 CTA, VoteButton 선택 상태, 카운트다운 보더(일반)
- **앰버 50/100/300/600/700/900** — ResultBar 의 솔로몬의 선택, "솔로몬의 선택" 배너
- **레드 200/500** — `urgent` (1h 미만)
- **라운딩** — `rounded-2xl` (카드/큰 버튼), `rounded-xl` (인풋), `rounded-full` (아이콘 버튼/뱃지)
- **그림자** — `shadow-sm` 기본, 선택 시 `shadow-md shadow-indigo-200`(VoteButton), 솔로몬 카드 `shadow-amber-100`

### Framer Motion 활용 위치
- `CountdownTimer` — `AnimatePresence mode="popLayout"` + `motion.span key={seconds}` 마이크로 스케일(0.92 → 1).
- `VoteButton` — `whileTap { scale: 0.97 }` + 선택 시 체크 아이콘 spring scale(0 → 1).
- `ResultBar` — `motion.div initial={{ width: 0 }} animate={{ width: "{percent}%" }}` 1s ease-out + delay stagger(0.08s).
- `app/post/[id]/page.tsx` — 본문 카드 fade-up, 솔로몬 배너 scale-in.
- `app/post/create/page.tsx` — `AnimatePresence` 로 옵션 추가/제거 시 height 슬라이드.

### 폼 UX (작성 페이지)
- **글자 수 카운터** — 30자 이하 남으면 amber, 초과 시 red.
- **선택지 검증** — 클라이언트 측에서 빈값/중복/길이 모두 즉시 차단(중복은 대소문자/공백 정규화).
- **이미지 URL 미리보기** — `onError` 시 자연스럽게 숨김.
- **인증 가드 이중화** — 미들웨어 외에도 `auth.getUser()` 로 한 번 더 확인 → 미로그인 시 `/login?redirect=/post/create`.

## 3-6. 검증 결과
- `npx tsc --noEmit` — 출력 없음 (exit 0). 전체 프로젝트 타입 통과.
- 런타임/시각 검증은 Phase 4 (Backend API 라우트 완성 후) + QA 에서 수행.

## 3-7. Phase 4 인수인계 (다음 작업)

### 백엔드(`solomon-backend`)에게 요청
1. **`app/api/posts/route.ts`** — `POST` (게시글 작성)
   - `content / image_url / options[]` 를 받아 `posts` + `options` 트랜잭션 INSERT.
   - 응답: `{ post: { id } }` 또는 `{ id }`.
2. **`app/api/posts/[id]/route.ts`** — `GET` (단건 + 본인 투표 + 결과)
   - `isExpired` 분기로 vote_count/`solomon_choice_id` 포함 여부 결정.
   - `my_vote` 는 현재 세션 사용자 기준으로 `votes` 1행 조회.
3. **`app/api/vote/route.ts`** — `POST`
   - body `{ post_id, option_id }` → `votes` INSERT, RLS 가 active/expires_at/1인1회 검증.
   - 실패 시 사용자 친화적 한국어 메시지 (예: "이미 투표한 게시글입니다").
4. **이미지 업로드 (Phase 5)** — Supabase Storage `post-images` 버킷 + presigned URL.

### 프론트엔드 후속 (Phase 5+ 권장)
- `app/my/page.tsx` — 솔로몬 지수, 칭호, 내가 쓴 글 + RPC `get_user_solomon_index`.
- `app/profile/[id]/page.tsx` — 다른 사용자 프로필.
- `components/profile/SolomonIndex.tsx` — 도넛/게이지 (`getTitleByIndex`).
- `components/profile/TitleBadge.tsx` — 인라인 칭호 뱃지.
- `app/post/[id]/loading.tsx` — Suspense fallback (현재는 `useEffect` 내부 스켈레톤만 있음).
- `BottomNav` 작성 버튼 → `/post/create` 로 연결되는지 확인(이미 그렇게 라우팅되어 있다고 가정 — Phase 2 보고서 참조).

### QA(`solomon-qa`)에게 요청
- 블라인드 룰: 진행중 게시글에서 `vote_count` 가 응답에 절대 안 섞이는지 확인.
- 1h 미만 시 `urgent` (red) 표시 동작 확인.
- 옵션 2개 미만/4개 초과/중복 등 작성 폼 검증.
- `useVote` 의 낙관적 업데이트 → 실패 시 롤백 시나리오 (네트워크 차단으로 재현).
- `npx tsc --noEmit` 재실행.

## 3-8. 가정 사항 (Phase 3)

1. **API 응답 형식**: 위 3-3 의 계약대로 백엔드가 응답한다고 가정. 실제 응답 구조가 다르면 클라이언트의 `FetchPostResponse` / 응답 파싱 부분 조정 필요.
2. **`my_vote` 필드**: `PostWithOptions` 타입에 이미 정의되어 있어 그대로 활용. 백엔드가 `null` 또는 객체로 반환하는 것을 가정.
3. **솔로몬의 선택 식별**: 백엔드가 `solomon_choice_id` 를 함께 보내주는 것이 가장 깔끔하지만, 누락 시 옵션의 `vote_count` 로 직접 fallback 계산.
4. **이미지 업로드는 Phase 5**: 현 단계는 외부 URL 입력만 허용. 잘못된 URL 은 미리보기 자연 실패로 처리.
5. **lucide-react 아이콘 사용**: `Clock`, `Check`, `ArrowLeft`, `EyeOff`, `Sparkles`, `ImagePlus`, `Plus`, `Trash2` — 모두 v1.14 에 존재 확인된 표준 아이콘.
6. **Toaster 위치**: `top-center`, `richColors` (success=초록, error=빨강 자동). 모바일 가독성 우선.

