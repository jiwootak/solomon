---
name: solomon-orchestrator
description: "모두의 솔로몬 5단계 개발 파이프라인 오케스트레이터. DB·Auth 세팅, Core UI, 투표 로직, 솔로몬 지수, PWA 전체 빌드를 조율한다. '솔로몬 빌드해줘', 'Phase N 진행', '처음부터 만들어줘', '기능 추가해줘' 등 개발 작업 요청 시 반드시 이 스킬을 사용할 것."
---

# Solomon Orchestrator

PM → Backend → Frontend → QA 에이전트 팀을 조율하여 "모두의 솔로몬"을 5단계로 완성하는 통합 워크플로우.

## 실행 모드: 파이프라인 + 병렬 (서브 에이전트)

각 Phase는 이전 Phase 산출물에 의존하여 순차 실행. Phase 3·4는 Backend+Frontend 병렬.

## 에이전트 구성

| 에이전트 | 타입 | 역할 | 출력 |
|---------|------|------|------|
| solomon-pm | 커스텀 | PRD 작성 | `_workspace/01_pm_prd.md` |
| solomon-backend | 커스텀 | DB/API 구현 | `supabase/`, `types/`, `app/api/` |
| solomon-frontend | 커스텀 | UI/훅 구현 | `app/`, `components/`, `hooks/` |
| solomon-qa | 커스텀 | 검증 | `_workspace/04_qa_report.md` |

---

## 전체 빌드 워크플로우 (Phase 1~5 순차 실행)

### Phase 0: 준비

```
mkdir -p _workspace
사용자 입력을 _workspace/00_input.md 에 저장
```

---

### Phase 1: DB & Auth Setup (Backend 전담)

**목표**: Supabase 스키마 + RLS + Auth 세팅 코드

```
Agent(
  subagent_type: "solomon-backend",
  model: "opus",
  prompt: """
  .claude/agents/AGENTS.md를 먼저 읽어라.
  
  Phase 1 작업: DB & Auth Setup
  
  다음을 구현하라:
  
  1. supabase/schema.sql — 전체 DDL
     - users: id(uuid, auth 연결), nickname, avatar_url, total_votes(default 0), majority_matched_votes(default 0)
     - posts: id, user_id, content(text), image_url, created_at, expires_at(created_at + INTERVAL '24 hours'), status('active'|'closed')
     - options: id, post_id, option_text, option_order(int)
     - votes: id, post_id, option_id, user_id, created_at; UNIQUE(post_id, user_id)
     
  2. RLS 정책:
     - posts: 누구나 SELECT, 본인만 INSERT/UPDATE/DELETE
     - options: 누구나 SELECT, 본인 post에만 INSERT
     - votes: 본인 것만 SELECT/INSERT, expires_at 전 vote_count 집계 조회 금지
     - users: 본인 프로필만 UPDATE, 모두 SELECT
     
  3. 트리거:
     - on_auth_user_created: auth.users INSERT → public.users 행 자동 생성
     - on_post_closed: posts.status가 'active'→'closed'로 바뀔 때 솔로몬 지수 업데이트
       (최다 득표 option에 투표한 users의 majority_matched_votes + 1)
  
  4. lib/supabase/client.ts — createBrowserClient 래퍼
  5. lib/supabase/server.ts — createServerClient 래퍼 (쿠키 기반)
  6. lib/supabase/middleware.ts — updateSession 유틸
  7. middleware.ts — 인증 미들웨어 (보호 라우트: /post/create, /my)
  8. types/solomon.ts — 전체 DB 타입 정의
  
  완료 후 _workspace/03_backend_report.md에 스키마 요약과 주요 RLS 정책 목록을 작성하라.
  """
)
```

완료 후 확인: `supabase/schema.sql`, `types/solomon.ts`, `lib/supabase/*.ts` 존재 여부.

---

### Phase 2: Core UI & Layout (Frontend 전담)

**목표**: 모바일 우선 레이아웃 + 메인 피드 UI

```
Agent(
  subagent_type: "solomon-frontend",
  model: "opus",
  prompt: """
  .claude/agents/AGENTS.md와 _workspace/03_backend_report.md(존재 시)를 읽어라.
  
  Phase 2 작업: Core UI & Layout
  
  다음을 구현하라:
  
  1. app/layout.tsx — 루트 레이아웃
     - Geist 폰트 (또는 Inter)
     - 모바일 하단 네비게이션 바 (홈, 작성하기, 내 프로필)
     - PWA viewport meta 포함
  
  2. app/globals.css — Tailwind 설정
     - 인디고(indigo) 주조색, 앰버(amber) 강조
     
  3. app/page.tsx — 홈 피드
     - "진행중" / "종료됨" 탭 전환
     - 각 탭에 PostCard 그리드
     - 무한 스크롤 또는 페이지네이션
  
  4. components/feed/PostCard.tsx — 피드 카드
     - 게시글 내용, 선택지 수, 투표 참여 수(종료 시만), 남은 시간/종료 표시
     - 블라인드 룰: 진행중 카드에는 득표율 절대 표시 금지
     - Framer Motion: 카드 등장 애니메이션
  
  5. components/feed/FeedTabs.tsx — 탭 컴포넌트
  
  6. components/BottomNav.tsx — 하단 네비게이션
     - 홈(/) / 작성(/post/create) / 내 프로필(/my) 3개 탭
  
  7. app/(auth)/login/page.tsx — 로그인
     - Google 소셜 로그인 버튼
     - 이메일 로그인 폼
  
  완료 후 _workspace/03_frontend_report.md에 구현된 파일 목록과 라우트를 작성하라.
  """
)
```

---

### Phase 3: Voting Logic & State Management (Backend + Frontend 병렬)

**목표**: 게시글 작성 + 24h 타이머 + 투표 처리

**Backend:**
```
Agent(
  subagent_type: "solomon-backend",
  model: "opus",
  run_in_background: true,
  prompt: """
  .claude/agents/AGENTS.md와 supabase/schema.sql을 읽어라.
  
  Phase 3 Backend 작업: 투표 API
  
  1. app/api/vote/route.ts — POST /api/vote
     - body: { post_id, option_id }
     - 인증 확인, 게시글 expires_at 검증 (종료 후 투표 거부)
     - Supabase insert (unique 제약으로 중복 방지)
     - 응답: { success: true } 또는 에러
  
  2. app/api/posts/route.ts — GET(피드), POST(작성)
     - GET: status 필터, expires_at 기준 결과 숨김
     - POST: content, options 배열, image_url; expires_at = now() + 24h 자동 설정
  
  3. app/api/posts/[id]/route.ts — GET(상세)
     - expires_at 이전: options에 vote_count 포함 금지
     - expires_at 이후: vote_count, 솔로몬의 선택(최다 득표 option_id) 포함
  
  완료 후 _workspace/03_backend_report.md에 API 스펙 추가.
  """
)
```

**Frontend (병렬):**
```
Agent(
  subagent_type: "solomon-frontend",
  model: "opus",
  run_in_background: true,
  prompt: """
  .claude/agents/AGENTS.md와 types/solomon.ts를 읽어라.
  
  Phase 3 Frontend 작업: 투표 UI + 훅
  
  1. hooks/useCountdown.ts
     - expires_at를 받아 남은 시간(시:분:초) 반환
     - 1초 인터벌, unmount 시 cleanup
     - 종료 시 { expired: true } 반환
  
  2. hooks/useVote.ts
     - 낙관적 업데이트: 투표 즉시 로컬 상태 반영
     - POST /api/vote 호출
     - 실패 시 롤백 + 에러 토스트
     - 이미 투표한 경우 투표 버튼 비활성화
  
  3. app/post/[id]/page.tsx — 게시글 상세 + 투표
     - CountdownTimer 표시
     - 진행중: VoteButton 목록 (블라인드)
     - 종료 후: ResultBar (득표율 애니메이션)
     - 솔로몬의 선택 하이라이트 (앰버 색상 + 왕관 아이콘)
  
  4. components/post/VoteButton.tsx
     - 선택지 텍스트 + 투표 버튼
     - 본인 선택 표시 (체크 아이콘)
     - Framer Motion: 탭 시 스케일 애니메이션
  
  5. components/post/CountdownTimer.tsx
     - 시:분:초 표시, 1시간 미만 시 빨간색
  
  6. components/post/ResultBar.tsx
     - 득표율 가로 바 (Framer Motion으로 width 애니메이션)
     - 솔로몬의 선택: 앰버 + 👑
  
  7. app/post/create/page.tsx — 게시글 작성
     - 내용 입력, 이미지 업로드(선택), 선택지 동적 추가(최소 2개, 최대 4개)
     - 제출 → POST /api/posts → 완성 페이지로 이동
  
  완료 후 _workspace/03_frontend_report.md 업데이트.
  """
)
```

두 에이전트 완료까지 대기.

---

### Phase 4: Profile & Solomon Index (Backend + Frontend 병렬)

**목표**: 마이페이지 + 솔로몬 지수 대시보드

**Backend:**
```
Agent(
  subagent_type: "solomon-backend",
  model: "opus",
  run_in_background: true,
  prompt: """
  .claude/agents/AGENTS.md와 supabase/schema.sql을 읽어라.
  
  Phase 4 Backend 작업: 솔로몬 지수 API
  
  1. app/api/solomon-index/[userId]/route.ts
     - 해당 유저의 total_votes, majority_matched_votes 조회
     - 솔로몬 지수(%) 계산 및 칭호 결정 반환
     - 응답: { index: number, title: string, total_votes: number, matched: number }
  
  2. app/api/profile/[userId]/route.ts
     - 유저 프로필 + 최근 투표한 게시글 목록
     - 작성한 게시글 목록
  
  칭호 기준:
  - 90%+: "👑 진정한 솔로몬"
  - 70~89%: "⚖️ 현명한 판단자"
  - 50~69%: "🤔 고민하는 시민"
  - 30~49%: "🌊 역류하는 물고기"
  - ~29%: "🎸 마이웨이 힙스터"
  
  완료 후 _workspace/03_backend_report.md에 API 추가.
  """
)
```

**Frontend (병렬):**
```
Agent(
  subagent_type: "solomon-frontend",
  model: "opus",
  run_in_background: true,
  prompt: """
  .claude/agents/AGENTS.md를 읽어라.
  
  Phase 4 Frontend 작업: 프로필 + 솔로몬 지수 UI
  
  1. app/my/page.tsx — 내 프로필 (로그인 필요)
     - 아바타, 닉네임, 솔로몬 지수 게이지
     - 칭호 배지
     - 내가 작성한 게시글 목록
     - 내가 투표한 게시글 목록
  
  2. app/profile/[id]/page.tsx — 타인 프로필
     - 공개 프로필 (솔로몬 지수, 칭호, 작성 게시글)
  
  3. components/profile/SolomonIndexGauge.tsx
     - 0~100% 원형 또는 가로 게이지
     - Framer Motion: 마운트 시 0 → 실제 값 애니메이션
     - 퍼센트 숫자 카운팅 애니메이션
  
  4. components/profile/TitleBadge.tsx
     - 칭호 이모지 + 텍스트 뱃지
     - 칭호별 색상 (솔로몬=앰버, 힙스터=인디고 등)
  
  5. app/api/auth/callback/route.ts
     - Supabase OAuth 콜백 처리
  
  완료 후 _workspace/03_frontend_report.md 업데이트.
  """
)
```

---

### Phase 5: PWA & Polish (Frontend 전담)

**목표**: PWA 설정 + Vercel 배포 준비

```
Agent(
  subagent_type: "solomon-frontend",
  model: "opus",
  prompt: """
  .claude/agents/AGENTS.md를 읽어라.
  
  Phase 5 작업: PWA & Polish
  
  1. next.config.js — next-pwa 설정
     ```js
     const withPWA = require('next-pwa')({ dest: 'public', register: true, skipWaiting: true });
     module.exports = withPWA({ ... });
     ```
  
  2. public/manifest.json
     - name: "모두의 솔로몬", short_name: "솔로몬"
     - 테마 컬러: #4F46E5 (인디고)
     - 아이콘 설정 (192x192, 512x512 — placeholder SVG 생성)
     - display: standalone, orientation: portrait
  
  3. 전체 UI 폴리시:
     - 로딩 스켈레톤 (PostCard, ProfilePage)
     - 에러 바운더리 (app/error.tsx, app/global-error.tsx)
     - 404 페이지 (app/not-found.tsx)
     - 빈 상태 UI (피드 없을 때, 투표 없을 때)
  
  4. app/layout.tsx에 PWA 메타 태그 추가:
     ```html
     <meta name="application-name" content="모두의 솔로몬" />
     <meta name="mobile-web-app-capable" content="yes" />
     <link rel="manifest" href="/manifest.json" />
     ```
  
  5. Vercel 배포 체크리스트 문서: _workspace/05_deploy_checklist.md
     - 환경 변수 목록
     - Supabase 실서비스 프로젝트 설정 항목
     - 배포 전 확인 사항
  
  완료 후 _workspace/03_frontend_report.md 최종 업데이트.
  """
)
```

---

### Phase 6: QA (최종 검증)

```
Agent(
  subagent_type: "solomon-qa",
  model: "opus",
  prompt: """
  .claude/agents/AGENTS.md를 읽어라.
  _workspace/ 하위 모든 파일을 읽고 구현 파일을 교차 검증하라.
  
  검증 순서:
  1. [P0] 블라인드 룰 위반 검사 — app/api/posts/[id]/route.ts, 각 컴포넌트의 expires_at 분기
  2. npx tsc --noEmit 실행 → 결과 전문 보고서에 첨부
  3. PRD 충족 체크리스트 (5개 Phase 모두 커버)
  4. API 응답 shape ↔ types/solomon.ts 교차 비교
  5. 투표 1회 제한 로직 (unique 제약 + 클라이언트 검증) 확인
  
  결과: _workspace/04_qa_report.md
  """
)
```

---

### Phase 7: 결과 보고

QA 보고서 분석 후 사용자에게 요약:
- ✅ 완료된 기능 목록
- ⚠️ 수정 필요 사항 (있는 경우)
- 📋 Supabase SQL Editor에서 실행할 마이그레이션
- 🚀 Vercel 배포 다음 단계

---

## 단일 기능 추가 워크플로우

기존 프로젝트에 기능 하나만 추가할 때:

```
Phase 0: _workspace/ 준비
Phase 1: PM → PRD (solomon-pm)
Phase 2: PRD에 DB 변경 있으면 Backend, UI만 있으면 Frontend만 실행
Phase 3: QA
Phase 4: 결과 보고
```

---

## 데이터 전달 프로토콜

파일 기반. 각 에이전트는 `_workspace/` 폴더의 이전 산출물을 읽는다.

| 파일 | 작성자 | 독자 |
|------|--------|------|
| `_workspace/00_input.md` | 오케스트레이터 | PM |
| `_workspace/01_pm_prd.md` | PM | Backend, Frontend |
| `_workspace/03_backend_report.md` | Backend | Frontend, QA |
| `_workspace/03_frontend_report.md` | Frontend | QA |
| `_workspace/04_qa_report.md` | QA | 오케스트레이터 |
| `_workspace/05_deploy_checklist.md` | Frontend(Phase 5) | 사용자 |

---

## 에러 핸들링

- **Backend 실패**: QA에 실패 정보 전달, 보고서에 누락 명시
- **Frontend 실패**: 같은 방식
- **P0 블라인드 룰 위반 발견**: 즉시 Frontend/Backend에 수정 지시 후 QA 재실행
- **TypeScript 오류**: Frontend에 수정 지시 후 QA 재검증
- **최대 재시도**: 에이전트당 1회 재시도, 재실패 시 보고서에 명시하고 계속

---

## 테스트 시나리오

### 정상 흐름 (전체 빌드)

```
입력: "모두의 솔로몬 전체 빌드해줘 — Phase 1부터 시작"

예상 흐름:
Phase 1 → supabase/schema.sql, types/solomon.ts 생성
Phase 2 → 피드 UI, 레이아웃, 로그인 페이지 생성
Phase 3 → 투표 API, 카운트다운 훅, 투표 컴포넌트 생성
Phase 4 → 솔로몬 지수 API, 프로필 페이지 생성
Phase 5 → PWA 설정, 에러/404 페이지 생성
Phase 6 QA → 블라인드 룰 P0 PASS, tsc 통과
```

### 에러 흐름 (블라인드 룰 위반)

```
입력: "투표 현황 실시간으로 보여줘 (진행중에도)"

예상 흐름:
PM → PRD에 "블라인드 룰 위반 위험" 경고 섹션 작성
오케스트레이터 → 사용자에게 비즈니스 로직 충돌 확인 요청
확인 후: 진행중엔 투표 수만 (옵션별 득표율 숨김), 종료 후 결과 공개로 타협안 제시
```

---

## 트리거 검증

### Should-trigger
- "모두의 솔로몬 Phase 1 시작해줘"
- "투표 기능 만들어줘"
- "솔로몬 지수 추가해줘"
- "PWA 설정해줘"
- "처음부터 전부 빌드해줘"
- "게시글 작성 페이지 추가해줘"
- "카운트다운 타이머 구현해줘"

### Should-NOT-trigger
- "README 읽어줘" → 단순 파일 읽기
- "TypeScript 에러 설명해줘" → 설명 요청 (QA 에이전트 단독 호출)
- "Supabase 연결 방법 알려줘" → 정보 질문
