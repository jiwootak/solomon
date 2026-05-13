# QA 보고서 — 모두의 솔로몬

## P0: 블라인드 룰 검증 — ✅ PASS

### 검증 항목

| 항목 | 위치 | 결과 |
|------|------|------|
| API에서 expires_at 전 vote_count 반환 | `app/api/posts/[id]/route.ts:132` | PASS — `expired` 분기 후에만 vote_count 포함 |
| 피드 API에서 vote_count SELECT 금지 | `app/api/posts/route.ts:53` | PASS — options에서 vote_count 절대 미조회 |
| PostCard에서 expired 전 결과 노출 금지 | `components/feed/PostCard.tsx:68` | PASS — `{expired ? <결과> : <블라인드>}` 패턴 |
| ResultBar 노출 조건 | `app/post/[id]/page.tsx` | PASS — isExpired 이후에만 ResultBar 렌더링 |
| 투표 API에서 다른 사용자 투표 정보 노출 | `app/api/vote/route.ts:17` | PASS — 응답에 vote_count 미포함 |

### 블라인드 3중 방어
- **DB 레벨**: RLS — votes 테이블 SELECT 정책이 본인 row만 허용
- **API 레벨**: `app/api/posts/[id]/route.ts` — `expired` 여부에 따라 vote_count 분기
- **클라이언트 레벨**: `PostCard`, `post/[id]/page.tsx` — `isExpired()` 기준 조건부 렌더링

---

## TypeScript 컴파일 — ✅ PASS

```
npx tsc --noEmit → 종료코드 0, 에러 없음
```

---

## Production Build — ✅ PASS

```
npm run build → 성공 (13개 페이지 정적 생성 완료)
```

빌드 경로:
- `○` (Static): `/`, `/login`, `/register`, `/my`, `/post/create`, `/not-found`
- `ƒ` (Dynamic): `/post/[id]`, `/profile/[id]`, `/api/*` 전체

---

## PRD 충족 체크리스트

| 요구사항 | 구현 여부 |
|---------|---------|
| 소셜 로그인 (Google) | ✅ `app/(auth)/login/LoginForm.tsx` |
| 이메일 로그인/회원가입 | ✅ `app/(auth)/login/`, `register/` |
| 게시글 작성 (내용 + 선택지 2~4개) | ✅ `app/post/create/page.tsx` |
| 업로드 즉시 24시간 타이머 시작 | ✅ `supabase/schema.sql` — `expires_at DEFAULT now()+24h` |
| 24시간 카운트다운 표시 | ✅ `hooks/useCountdown.ts`, `components/post/CountdownTimer.tsx` |
| 24시간 블라인드 룰 | ✅ P0 PASS |
| 1인 1투표 제한 | ✅ `votes` UNIQUE(post_id, user_id) + `useVote` 클라이언트 검증 |
| 투표 종료 후 결과 공개 | ✅ `components/post/ResultBar.tsx` |
| 솔로몬의 선택 하이라이트 | ✅ `ResultBar` — amber + 👑 |
| 솔로몬 지수 계산 | ✅ `lib/solomon.ts` + `supabase/schema.sql` 트리거 |
| 칭호 시스템 5단계 | ✅ `types/solomon.ts:getTitleByIndex()`, `lib/solomon.ts:getTitleByIndex()` |
| 마이페이지 대시보드 | ✅ `app/my/page.tsx` |
| 타인 프로필 공개 | ✅ `app/profile/[id]/page.tsx` |
| PWA 설정 | ✅ `@ducanh2912/next-pwa`, `public/manifest.json` |
| 하단 네비게이션 | ✅ `components/BottomNav.tsx` |
| 에러 페이지 (404, error) | ✅ `app/not-found.tsx`, `error.tsx`, `global-error.tsx` |
| 로딩 스켈레톤 | ✅ `app/my/loading.tsx`, `app/post/create/loading.tsx` |

---

## API 경계면 정합성

| API | 응답 타입 | 프론트 기대 타입 | 일치 |
|-----|---------|--------------|------|
| `GET /api/posts/[id]` | `{ post, options, user_vote_option_id, solomon_choice? }` | `app/post/[id]/page.tsx` | ✅ |
| `POST /api/vote` | `{ success: true, vote_id }` | `hooks/useVote.ts` | ✅ |
| `GET /api/solomon-index/[userId]` | `{ user_id, index, title, total_votes, matched }` | `SolomonIndex` type | ✅ |
| `GET /api/profile/me` | `{ user, solomon_index, authored_posts, voted_posts }` | `app/my/page.tsx` | ✅ |

---

## 발견된 이슈 (수정 완료)

1. **next-pwa v5 + Node.js 24 호환성** → `@ducanh2912/next-pwa`로 교체 ✅
2. **`useSearchParams` Suspense 누락** — `/login` 페이지 prerender 오류 → `<Suspense>` 래퍼 추가 ✅
3. **API 라우트 정적 생성 시도** → `export const dynamic = "force-dynamic"` 추가 ✅

---

## 권고사항

1. **PWA 아이콘**: SVG 파일이 placeholder — iOS Safari 완전 지원을 위해 PNG 교체 권장
2. **pg_cron 설정**: `supabase/migrations/001_auto_close_posts.sql` Supabase에서 실행 (만료 게시글 자동 종료)
3. **이미지 업로드**: 현재 URL 직접 입력 방식 — Supabase Storage 버킷 연동 고려
4. **Kakao 로그인**: PRD에 언급됐으나 미구현 — Supabase Auth > Kakao Provider 추가 필요
5. **Vercel 배포**: `_workspace/05_deploy_checklist.md` 참조
