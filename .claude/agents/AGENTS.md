# 모두의 솔로몬 — 프로젝트 에이전트 가이드

## 프로젝트 개요

유저들이 일상적인 갈등/딜레마를 올리고 24시간 동안 투표를 받아 결과를 확인하는 가벼운 엔터테인먼트 투표 커뮤니티.

핵심 흐름: **게시글 작성 → 24h 블라인드 투표 → 결과 공개(솔로몬의 선택) → 솔로몬 지수 갱신**

---

## 기술 스택

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 프레임워크 | Next.js | 14 | App Router |
| 언어 | TypeScript | ^5 | strict mode |
| 스타일 | Tailwind CSS | ^3 | 모바일 우선 |
| 애니메이션 | Framer Motion | ^11 | 가벼운 전환 효과 |
| 상태관리 | Zustand | ^4 | 클라이언트 전역 상태 |
| 백엔드/DB | Supabase (PostgreSQL) | ^2 | RLS 적용, `@supabase/ssr` |
| PWA | next-pwa | ^5 | 서비스 워커, manifest |
| 배포 | Vercel | - | |

---

## 핵심 비즈니스 로직

### 24시간 블라인드 룰
- `posts.expires_at = created_at + INTERVAL '24 hours'`
- `expires_at` 이전: 투표 수/비율 **절대 공개 금지** (클라이언트·서버 모두)
- `expires_at` 이후: 결과 공개, 최다 득표 선택지 = "솔로몬의 선택" 하이라이트

### 투표 제한
- 1인 1게시글 1회 (`votes` 테이블 unique 제약)
- 종료된 게시글 투표 불가 (`status = 'closed'` 또는 `expires_at < now()`)

### 솔로몬 지수 계산
```
솔로몬_지수 = majority_matched_votes / total_votes × 100
```
- `majority_matched_votes`: 본인이 투표한 선택지가 최종 1위를 차지한 횟수
- 게시글 `status`가 `closed`로 바뀔 때 트리거로 업데이트

### 칭호 시스템
| 지수 | 칭호 |
|------|------|
| 90%+ | 👑 진정한 솔로몬 |
| 70~89% | ⚖️ 현명한 판단자 |
| 50~69% | 🤔 고민하는 시민 |
| 30~49% | 🌊 역류하는 물고기 |
| ~29% | 🎸 마이웨이 힙스터 |

---

## 디렉토리 구조

```
solomon/
├── app/
│   ├── layout.tsx             # 루트 레이아웃 (PWA manifest 연결)
│   ├── page.tsx               # 홈 피드 (진행중 / 종료됨 탭)
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── post/
│   │   ├── create/page.tsx    # 게시글 작성
│   │   └── [id]/page.tsx      # 게시글 상세 + 투표
│   ├── profile/
│   │   └── [id]/page.tsx      # 유저 프로필 + 솔로몬 지수
│   ├── my/page.tsx            # 내 프로필
│   └── api/
│       ├── auth/callback/route.ts
│       └── solomon-index/route.ts  # 솔로몬 지수 계산 API
│
├── components/
│   ├── ui/                    # shadcn/ui 공통 컴포넌트
│   ├── feed/                  # 피드 관련 (PostCard, FeedTabs)
│   ├── post/                  # 게시글 관련 (VoteButton, CountdownTimer, ResultBar)
│   └── profile/               # 프로필 관련 (SolomonIndex, TitleBadge)
│
├── hooks/
│   ├── useCountdown.ts        # 24시간 카운트다운 훅
│   └── useVote.ts             # 투표 처리 + 낙관적 업데이트 훅
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # 브라우저 클라이언트
│   │   ├── server.ts          # 서버 클라이언트
│   │   └── middleware.ts      # updateSession 유틸
│   └── utils.ts               # cn() 등 유틸
│
├── types/
│   └── solomon.ts             # DB 타입 정의
│
├── supabase/
│   ├── schema.sql             # DDL + RLS
│   └── seed.sql               # 개발용 시드
│
├── public/
│   ├── manifest.json          # PWA 매니페스트
│   └── icons/                 # PWA 아이콘
│
├── middleware.ts              # Next.js 미들웨어 (인증)
└── next.config.js             # next-pwa 설정
```

---

## 핵심 데이터 모델

```typescript
// types/solomon.ts

interface User {
  id: string;
  nickname: string;
  avatar_url: string | null;
  total_votes: number;
  majority_matched_votes: number;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  expires_at: string;          // created_at + 24h
  status: 'active' | 'closed';
}

interface Option {
  id: string;
  post_id: string;
  option_text: string;
  option_order: number;
  vote_count?: number;         // expires_at 이후에만 노출
}

interface Vote {
  id: string;
  post_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}
```

---

## 코딩 컨벤션

### Supabase
- **클라이언트 컴포넌트**: `@/lib/supabase/client.ts` createBrowserClient
- **서버 컴포넌트/API**: `@/lib/supabase/server.ts` createServerClient
- **미들웨어**: `middleware.ts` + `lib/supabase/middleware.ts`

### 블라인드 룰 엄수
```typescript
// 이렇게 하면 안 됨 — expires_at 전 득표 수 노출
const { data } = await supabase.from("options").select("*, votes(count)");

// 이렇게 해야 함
const isExpired = new Date(post.expires_at) < new Date();
const query = isExpired
  ? supabase.from("options").select("*, votes(count)")
  : supabase.from("options").select("id, option_text, option_order");
```

### 스타일
- 색상: 인디고(`indigo`) 주조색, 앰버(`amber`) 강조(솔로몬 선택), 슬레이트 텍스트
- 모바일 우선 — `max-w-lg mx-auto` 중앙 정렬
- 애니메이션: Framer Motion `initial/animate/exit` 패턴

---

## 하네스 에이전트 팀

새 기능 개발 시 `solomon-orchestrator` 스킬이 팀을 조율합니다.

| 에이전트 | 역할 |
|---------|------|
| `solomon-pm` | 기획/PRD 작성 |
| `solomon-backend` | DB 스키마, RLS, API 라우트, 솔로몬 지수 계산 |
| `solomon-frontend` | Next.js 컴포넌트, 훅, 애니메이션 |
| `solomon-qa` | 타입 검증, 블라인드 룰 정합성, PRD 충족 여부 |

---

## 환경 설정

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
